import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const avatarColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#d97706"];

export default async function CustomersPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const customers = await prisma.customer.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });

    // Get order counts per customer email
    const orderCounts = await prisma.order.groupBy({
        by: ["customerEmail"],
        where: { storeId },
        _count: { id: true },
        _sum: { total: true },
    });

    const orderMap = new Map(
        orderCounts.map(o => [o.customerEmail, { count: o._count.id, total: o._sum.total ?? 0 }])
    );

    // Also count orders by customer name for those without email
    const totalCustomers = customers.length;
    const totalOrders = orderCounts.reduce((sum, o) => sum + o._count.id, 0);

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Customers</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{totalCustomers} registered customers · {totalOrders} total orders</p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            {["Customer", "Email", "Orders", "Total Spent", "Joined"].map((h) => (
                                <th key={h} style={{
                                    padding: "12px 20px", fontSize: "11px", fontWeight: 600,
                                    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left",
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer: any, i: number) => {
                            const initial = (customer.name ?? customer.email)[0].toUpperCase();
                            const color = avatarColors[i % avatarColors.length];
                            const stats = orderMap.get(customer.email) ?? { count: 0, total: 0 };
                            return (
                                <tr key={customer.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{
                                                width: "34px", height: "34px", borderRadius: "50%",
                                                background: color + "18", color,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "13px", fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {initial}
                                            </div>
                                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                                                {customer.name ?? "—"}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                        {customer.email}
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                                            background: stats.count > 0 ? "#dbeafe" : "var(--bg-subtle)",
                                            color: stats.count > 0 ? "#2563eb" : "var(--text-muted)",
                                        }}>
                                            {stats.count} order{stats.count !== 1 ? "s" : ""}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                        {stats.total > 0 ? `PKR ${stats.total.toLocaleString()}` : "—"}
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-muted)" }}>
                                        {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {customers.length === 0 && (
                    <div style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>No customers yet.</div>
                )}
            </div>
        </div>
    );
}