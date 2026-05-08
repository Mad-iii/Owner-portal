import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    const order = await prisma.order.findFirst({
        where: { id: orderId, storeId: session.user.storeId },
    });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status },
    });

    // When an order is delivered, update customer stats
    if (status === "DELIVERED" && order.customerEmail) {
        await prisma.customer.upsert({
            where: { storeId_email: { storeId: session.user.storeId, email: order.customerEmail } },
            update: {
                orderCount: { increment: 1 },
                totalSpend: { increment: order.total },
                name: order.customerName ?? undefined,
                phone: order.phone ?? undefined,
                address: order.address ?? undefined,
            },
            create: {
                storeId: session.user.storeId,
                email: order.customerEmail,
                name: order.customerName ?? null,
                phone: order.phone ?? null,
                address: order.address ?? null,
                orderCount: 1,
                totalSpend: order.total,
            },
        });
    }

    return NextResponse.json({ ok: true, status: updated.status });
}