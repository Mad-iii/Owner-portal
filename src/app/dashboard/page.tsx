import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SalesChart from "@/components/SalesChart";

export default async function DashboardPage() {
    const session = await auth();
    const storeId = session!.user.storeId;

    // All queries filtered by storeId — tenant isolation
    const [totalOrders, totalRevenue, totalProducts, totalCustomers, recentOrders] =
        await Promise.all([
            prisma.order.count({ where: { storeId } }),

            prisma.order.aggregate({
                where: { storeId, status: { not: "CANCELLED" } },
                _sum: { total: true },
            }),

            prisma.product.count({ where: { storeId } }),

            prisma.customer.count({ where: { storeId } }),

            prisma.order.findMany({
                where: { storeId },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: { items: true },
            }),
        ]);

    const stats = [
        { label: "Total Revenue", value: `PKR ${(totalRevenue._sum.total ?? 0).toLocaleString()}` },
        { label: "Total Orders", value: totalOrders.toLocaleString() },
        { label: "Products", value: totalProducts.toLocaleString() },
        { label: "Customers", value: totalCustomers.toLocaleString() },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-6">Overview</h1>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border p-5">
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Sales chart (client component) */}
            <div className="bg-white rounded-xl border p-6 mb-8">
                <h2 className="font-medium mb-4">Revenue over time</h2>
                <SalesChart storeId={storeId} />
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-xl border p-6">
                <h2 className="font-medium mb-4">Recent orders</h2>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-400 border-b">
                            <th className="pb-2 font-medium">Order</th>
                            <th className="pb-2 font-medium">Customer</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order) => (
                            <tr key={order.id} className="border-b last:border-0">
                                <td className="py-3">{order.orderNumber}</td>
                                <td className="py-3">{order.customerName ?? "Guest"}</td>
                                <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                            order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-3 text-right">PKR {order.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}