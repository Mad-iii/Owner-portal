import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SalesChart from "@/components/SalesChart";
import { TrendingUp, ShoppingCart, Package, Users } from "lucide-react";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

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
        { label: "Total Revenue", value: `PKR ${(totalRevenue._sum.total ?? 0).toLocaleString()}`, icon: TrendingUp, color: "#2563eb" },
        { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "#7c3aed" },
        { label: "Products", value: totalProducts.toLocaleString(), icon: Package, color: "#0891b2" },
        { label: "Customers", value: totalCustomers.toLocaleString(), icon: Users, color: "#059669" },
    ];

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Overview</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Welcome back — here's what's happening with your store.</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "20px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "8px",
                                background: stat.color + "18",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <stat.icon size={15} color={stat.color} />
                            </div>
                        </div>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
            }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "20px" }}>Revenue over time</h2>
                <SalesChart storeId={storeId} />
            </div>

            {/* Recent orders */}
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Orders</h2>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                            {["Order", "Customer", "Status", "Total"].map((h, i) => (
                                <th key={h} style={{
                                    padding: "12px 24px",
                                    fontSize: "11px", fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase", letterSpacing: "0.06em",
                                    textAlign: i === 3 ? "right" : "left",
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order: any) => (
                            <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ padding: "14px 24px", fontSize: "13px", fontWeight: 600, color: "var(--blue)" }}>{order.orderNumber}</td>
                                <td style={{ padding: "14px 24px", fontSize: "13px", color: "var(--text-primary)" }}>{order.customerName ?? "Guest"}</td>
                                <td style={{ padding: "14px 24px" }}>
                                    <span style={{
                                        padding: "3px 10px",
                                        borderRadius: "20px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: order.status === "DELIVERED" ? "#dcfce7" : order.status === "CANCELLED" ? "#fee2e2" : order.status === "SHIPPED" ? "#dbeafe" : "#fef9c3",
                                        color: order.status === "DELIVERED" ? "#16a34a" : order.status === "CANCELLED" ? "#dc2626" : order.status === "SHIPPED" ? "#2563eb" : "#a16207",
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 24px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>
                                    PKR {order.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recentOrders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "14px" }}>No orders yet.</div>
                )}
            </div>
        </div>
    );
}