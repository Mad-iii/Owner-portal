import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const orders = await prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Orders</h1>
            <div className="bg-white rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order: any) => (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-blue-600">{order.orderNumber}</td>
                                <td className="px-6 py-4 text-gray-700">{order.customerName ?? "Guest"}</td>
                                <td className="px-6 py-4 text-gray-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                            order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                                                    order.status === "PROCESSING" ? "bg-purple-100 text-purple-700" :
                                                        "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">PKR {order.total.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="text-center py-12 text-gray-400">No orders yet.</div>
                )}
            </div>
        </div>
    );
}