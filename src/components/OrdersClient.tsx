"use client";
import { useState } from "react";

const statusStyles: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "#fef9c3", color: "#a16207" },
    PROCESSING: { bg: "#ede9fe", color: "#7c3aed" },
    SHIPPED: { bg: "#dbeafe", color: "#2563eb" },
    DELIVERED: { bg: "#dcfce7", color: "#16a34a" },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
};

const statusFlow = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function OrderRow({ order: initialOrder }: { order: any }) {
    const [order, setOrder] = useState(initialOrder);
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);

    async function updateStatus(newStatus: string) {
        setUpdating(true);
        try {
            const res = await fetch("/api/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, status: newStatus }),
            });
            if (res.ok) {
                setOrder({ ...order, status: newStatus });
            }
        } finally {
            setUpdating(false);
        }
    }

    const style = statusStyles[order.status] ?? statusStyles.PENDING;
    const currentIdx = statusFlow.indexOf(order.status);
    const nextStatus = statusFlow[currentIdx + 1];

    return (
        <>
            <tr
                style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                onClick={() => setExpanded(!expanded)}
            >
                <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "var(--blue)", fontFamily: "monospace" }}>
                    {order.orderNumber}
                </td>
                <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{order.customerName ?? "Guest"}</div>
                    {order.phone && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{order.phone}</div>}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    {order.address ?? "—"}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </td>
                <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td style={{ padding: "14px 20px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: style.bg, color: style.color }}>
                        {order.status}
                    </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", textAlign: "right" }}>
                    PKR {order.total.toLocaleString()}
                </td>
            </tr>

            {expanded && (
                <tr style={{ background: "var(--bg-subtle)" }}>
                    <td colSpan={7} style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                            {/* Items */}
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Items</p>
                                {order.items.map((item: any) => (
                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>
                                        <span>{item.name} × {item.quantity}</span>
                                        <span style={{ color: "var(--text-muted)" }}>PKR {item.price.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Shipping */}
                            <div style={{ flex: 1, minWidth: "200px" }}>
                                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Shipping</p>
                                <p style={{ fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>{order.customerName}</p>
                                {order.phone && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>{order.phone}</p>}
                                {order.address && <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{order.address}</p>}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
                                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0px" }}>Update Status</p>
                                {nextStatus && order.status !== "CANCELLED" && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateStatus(nextStatus); }}
                                        disabled={updating}
                                        style={{
                                            padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                                            background: "var(--blue)", color: "white", border: "none", cursor: "pointer",
                                            opacity: updating ? 0.6 : 1,
                                        }}
                                    >
                                        {updating ? "Updating..." : `Mark as ${nextStatus}`}
                                    </button>
                                )}
                                {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); updateStatus("CANCELLED"); }}
                                        disabled={updating}
                                        style={{
                                            padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                                            background: "#fee2e2", color: "#dc2626", border: "none", cursor: "pointer",
                                            opacity: updating ? 0.6 : 1,
                                        }}
                                    >
                                        Cancel Order
                                    </button>
                                )}
                                {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No further actions</p>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function OrdersClient({ orders }: { orders: any[] }) {
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
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Click any row to see details and update status</p>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                {[
                    { label: "All", value: counts.all, color: "#2563eb" },
                    { label: "Pending", value: counts.pending, color: "#a16207" },
                    { label: "Delivered", value: counts.delivered, color: "#16a34a" },
                    { label: "Cancelled", value: counts.cancelled, color: "#dc2626" },
                ].map(item => (
                    <div key={item.label} style={{
                        padding: "8px 16px", background: "var(--bg-card)", border: "1px solid var(--border)",
                        borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.label}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, background: item.color + "18", color: item.color, padding: "2px 8px", borderRadius: "20px" }}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                            {["Order #", "Customer", "Address", "Items", "Date", "Status", "Total"].map((h, i) => (
                                <th key={h} style={{
                                    padding: "12px 20px", fontSize: "11px", fontWeight: 600,
                                    color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em",
                                    textAlign: i === 6 ? "right" : "left",
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => <OrderRow key={order.id} order={order} />)}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>No orders yet.</div>
                )}
            </div>
        </div>
    );
}