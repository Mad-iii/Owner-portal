import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    // Get the order BEFORE updating so we know the previous status
    const order = await prisma.order.findFirst({
        where: { id: orderId, storeId: session.user.storeId },
    });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update the order status
    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status },
    });

    const storeId = session.user.storeId;

    // Only create/increment customer when transitioning TO delivered for the first time
    if (status === "DELIVERED" && order.status !== "DELIVERED" && order.customerEmail) {
        const existing = await prisma.customer.findUnique({
            where: { storeId_email: { storeId, email: order.customerEmail } },
        });

        if (existing) {
            await prisma.customer.update({
                where: { storeId_email: { storeId, email: order.customerEmail } },
                data: {
                    orderCount: existing.orderCount + 1,
                    totalSpend: existing.totalSpend + order.total,
                    name: order.customerName ?? existing.name,
                    phone: order.phone ?? existing.phone,
                    address: order.address ?? existing.address,
                },
            });
        } else {
            await prisma.customer.create({
                data: {
                    storeId,
                    email: order.customerEmail,
                    name: order.customerName ?? null,
                    phone: order.phone ?? null,
                    address: order.address ?? null,
                    orderCount: 1,
                    totalSpend: order.total,
                },
            });
        }
    }

    // If moving away from DELIVERED (e.g. back to CANCELLED), decrement
    if (order.status === "DELIVERED" && status !== "DELIVERED" && order.customerEmail) {
        const existing = await prisma.customer.findUnique({
            where: { storeId_email: { storeId, email: order.customerEmail } },
        });

        if (existing) {
            await prisma.customer.update({
                where: { storeId_email: { storeId, email: order.customerEmail } },
                data: {
                    orderCount: Math.max(0, existing.orderCount - 1),
                    totalSpend: Math.max(0, existing.totalSpend - order.total),
                },
            });
        }
    }

    return NextResponse.json({ ok: true, status: updated.status });
}