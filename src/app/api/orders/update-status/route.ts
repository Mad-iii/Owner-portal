import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    // Make sure the order belongs to this store
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

    return NextResponse.json({ ok: true, status: updated.status });
}