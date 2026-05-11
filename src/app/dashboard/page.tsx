"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    lowStockProducts: { id: string; name: string; stock: number }[];
    revenueByDay: { label: string; revenue: number }[];
    recentOrders: {
        id: string;
        orderNumber: string;
        customerName: string | null;
        total: number;
        status: string;
        createdAt: string;
    }[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    DELIVERED: { bg: "#dcfce7", color: "#16a34a" },
    PENDING: { bg: "#fef9c3", color: "#a16207" },
    PROCESSING: { bg: "#dbeafe", color: "#2563eb" },
    SHIPPED: { bg: "#ede9fe", color: "#7c3aed" },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
};

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard")
            .then(r => r.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>Loading...</div>
    );

    if (!data) return (
        <div style={{ padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>Failed to load dashboard.</div>
    );

    const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue), 1);

    return (
        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Header */}
            <div>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Overview</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Welcome back. Here's what's happening with Dhanak.</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {[
                    { label: "Total Revenue", value: `PKR ${data.totalRevenue.toLocaleString()}`, sub: "from delivered orders", color: "#2563eb" },
                    { label: "Total Orders", value: data.totalOrders, sub: `${data.pendingOrders} pending`, color: "#7c3aed" },
                    { label: "Customers", value: data.totalCustomers, sub: "registered", color: "#059669" },
                    { label: "Products", value: data.totalProducts, sub: `${data.lowStockProducts.length} low stock`, color: "#d97706" },
                ].map(card => (
                    <div key={card.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{card.label}</p>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: card.color, marginBottom: "4px" }}>{card.value}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Order Status Breakdown */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Order Status Breakdown</h2>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {[
                        { label: "Pending", value: data.pendingOrders, ...STATUS_STYLES.PENDING },
                        { label: "Processing", value: data.processingOrders, ...STATUS_STYLES.PROCESSING },
                        { label: "Shipped", value: data.shippedOrders, ...STATUS_STYLES.SHIPPED },
                        { label: "Delivered", value: data.deliveredOrders, ...STATUS_STYLES.DELIVERED },
                        { label: "Cancelled", value: data.cancelledOrders, ...STATUS_STYLES.CANCELLED },
                    ].map(s => (
                        <div key={s.label} style={{ padding: "12px 20px", borderRadius: "10px", background: s.bg, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", minWidth: "100px" }}>
                            <span style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</span>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* Revenue Chart */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Revenue — Last 7 Days</h2>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
                        {data.revenueByDay.map(day => (
                            <div key={day.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                                    <div style={{
                                        width: "100%",
                                        height: `${Math.max((day.revenue / maxRevenue) * 100, day.revenue > 0 ? 4 : 0)}%`,
                                        background: day.revenue > 0 ? "#2563eb" : "var(--border)",
                                        borderRadius: "4px 4px 0 0",
                                        transition: "height 0.3s",
                                    }} />
                                </div>
                                <span style={{ fontSize: "9px", color: "var(--text-muted)", textAlign: "center", whiteSpace: "nowrap" }}>{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Low Stock */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Low Stock Alert</h2>
                    {data.lowStockProducts.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>All products well stocked ✓</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {data.lowStockProducts.map(p => (
                                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff7ed", borderRadius: "8px", border: "1px solid #fed7aa" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#7c2d12" }}>{p.name}</span>                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: "6px" }}>{p.stock} left</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Orders</h2>
                    <Link href="/dashboard/orders" style={{ fontSize: "12px", color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "var(--bg-subtle)" }}>
                            {["Order", "Customer", "Total", "Status", "Date"].map(h => (
                                <th key={h} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.recentOrders.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>No orders yet.</td></tr>
                        )}
                        {data.recentOrders.map(order => {
                            const s = STATUS_STYLES[order.status] ?? { bg: "var(--bg-subtle)", color: "var(--text-muted)" };
                            return (
                                <tr key={order.id} style={{ borderTop: "1px solid var(--border)" }}>
                                    <td style={{ padding: "12px 16px", fontSize: "13px", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>#{order.orderNumber}</td>
                                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>{order.customerName ?? "—"}</td>
                                    <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>PKR {order.total.toLocaleString()}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: s.bg, color: s.color }}>{order.status}</span>
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)" }}>
                                        {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}