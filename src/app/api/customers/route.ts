import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const storeId = session.user.storeId;

    // Fetch all customers
    const customers = await prisma.customer.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });

    // Fetch all DELIVERED orders with items, grouped by customer email
    const orders = await prisma.order.findMany({
        where: { storeId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    });

    // Build per-email order map
    const ordersByEmail = new Map<string, typeof orders>();
    for (const order of orders) {
        const key = order.customerEmail ?? order.customerName ?? "unknown";
        if (!ordersByEmail.has(key)) ordersByEmail.set(key, []);
        ordersByEmail.get(key)!.push(order);
    }

    const result = customers.map(customer => {
        const customerOrders = ordersByEmail.get(customer.email) ?? [];

        // Only count DELIVERED orders toward total spent
        const deliveredOrders = customerOrders.filter(o => o.status === "DELIVERED");
        const totalSpent = deliveredOrders.reduce((sum, o) => sum + o.total, 0);

        return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            createdAt: customer.createdAt,
            orderCount: deliveredOrders.length,
            totalSpent,
            orders: customerOrders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                total: o.total,
                currency: o.currency,
                createdAt: o.createdAt,
                items: o.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
            })),
        };
    });

    return NextResponse.json(result);
}