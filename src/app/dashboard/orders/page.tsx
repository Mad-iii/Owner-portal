import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const statusStyles: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "#fef9c3", color: "#a16207" },
    PROCESSING: { bg: "#ede9fe", color: "#7c3aed" },
    SHIPPED: { bg: "#dbeafe", color: "#2563eb" },
    DELIVERED: { bg: "#dcfce7", color: "#16a34a" },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
};

export default async function OrdersPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const orders = await prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
    });

    const counts = {
        all: orders.length,
        pending: orders.filter(o => o.status === "PENDING").length,
        delivered: orders.filter(o => o.status === "DELIVERED").length,
        cancelled: orders.filter(o => o.status === "CANCELLED").length,
    };

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Orders</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{counts.all} total orders</p>
            </div>

            {/* Summary pills */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                {[
                    { label: "All", value: counts.all, color: "#2563eb" },
                    { label: "Pending", value: counts.pending, color: "#a16207" },
                    { label: "Delivered", value: counts.delivered, color: "#16a34a" },
                    { label: "Cancelled", value: counts.cancelled, color: "#dc2626" },
                ].map(item => (
                    <div key={item.label} style={{
                        padding: "8px 16px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.label}</span>
                        <span style={{
                            fontSize: "12px", fontWeight: 700,
                            background: item.color + "18", color: item.color,
                            padding: "2px 8px", borderRadius: "20px",
                        }}>{item.value}</span>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
            }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            {["Order #", "Customer", "Items", "Date", "Status", "Total"].map((h, i) => (
                                <th key={h} style={{
                                    padding: "12px 20px",
                                    fontSize: "11px", fontWeight: 600,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase", letterSpacing: "0.06em",
                                    textAlign: i === 5 ? "right" : "left",
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order: any) => {
                            const style = statusStyles[order.status] ?? statusStyles.PENDING;
                            return (
                                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "var(--blue)", fontFamily: "DM Mono, monospace" }}>
                                        {order.orderNumber}
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{order.customerName ?? "Guest"}</div>
                                        {order.customerEmail && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{order.customerEmail}</div>}
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-muted)" }}>
                                        {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: "20px",
                                            fontSize: "11px", fontWeight: 600,
                                            background: style.bg, color: style.color,
                                        }}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>
                                        PKR {order.total.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>No orders yet.</div>
                )}
            </div>
        </div>
    );
}