import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const storeId = session.user.storeId;

    const [orders, customers, products] = await Promise.all([
        prisma.order.findMany({ where: { storeId }, include: { items: true }, orderBy: { createdAt: "desc" } }),
        prisma.customer.findMany({ where: { storeId } }),
        prisma.product.findMany({ where: { storeId } }),
    ]);

    const totalRevenue = orders
        .filter(o => o.status === "DELIVERED")
        .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = orders.filter(o => o.status === "PENDING").length;
    const processingOrders = orders.filter(o => o.status === "PROCESSING").length;
    const shippedOrders = orders.filter(o => o.status === "SHIPPED").length;
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;

    const lowStockProducts = products.filter(p => p.stock < 10 && p.active);

    // Revenue by day for last 7 days
    const now = new Date();
    const revenueByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        const label = date.toLocaleDateString("en-PK", { weekday: "short", day: "numeric" });
        const dayRevenue = orders
            .filter(o => {
                const d = new Date(o.createdAt);
                return o.status === "DELIVERED" &&
                    d.getDate() === date.getDate() &&
                    d.getMonth() === date.getMonth() &&
                    d.getFullYear() === date.getFullYear();
            })
            .reduce((sum, o) => sum + o.total, 0);
        return { label, revenue: dayRevenue };
    });

    const recentOrders = orders.slice(0, 5).map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
    }));

    return NextResponse.json({
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        lowStockProducts: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock })),
        revenueByDay,
        recentOrders,
    });
}