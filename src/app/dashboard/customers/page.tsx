"use client";

import React, { useEffect, useState } from "react";

const avatarColors = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#dc2626", "#d97706"];

interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    items: OrderItem[];
}

interface Customer {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    createdAt: string;
    orderCount: number;
    totalSpent: number;
    orders: Order[];
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    DELIVERED: { bg: "#dcfce7", color: "#16a34a" },
    PENDING: { bg: "#fef9c3", color: "#a16207" },
    PROCESSING: { bg: "#dbeafe", color: "#2563eb" },
    SHIPPED: { bg: "#ede9fe", color: "#7c3aed" },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/customers")
            .then(r => r.json())
            .then(setCustomers)
            .finally(() => setLoading(false));
    }, []);

    const totalOrders = customers.reduce((s, c) => s + c.orderCount, 0);

    function toggle(id: string) {
        setExpandedId(prev => prev === id ? null : id);
    }

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Customers</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {customers.length} registered customers · {totalOrders} total orders
                </p>
            </div>

            {loading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
            ) : (
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                                {["Customer", "Email", "Phone", "Address", "Orders", "Total Spent", "Joined"].map(h => (
                                    <th key={h} style={{
                                        padding: "12px 16px", fontSize: "11px", fontWeight: 600,
                                        color: "var(--text-muted)", textTransform: "uppercase",
                                        letterSpacing: "0.06em", textAlign: "left", whiteSpace: "nowrap",
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>
                                        No customers yet.
                                    </td>
                                </tr>
                            )}
                            {customers.map((customer, i) => {
                                const initial = (customer.name ?? customer.email)[0].toUpperCase();
                                const color = avatarColors[i % avatarColors.length];
                                const isExpanded = expandedId === customer.id;

                                return (
                                    <React.Fragment key={customer.id}>
                                        {/* Main Row */}
                                        <tr
                                            onClick={() => toggle(customer.id)}
                                            style={{
                                                borderBottom: isExpanded ? "none" : "1px solid var(--border)",
                                                cursor: "pointer",
                                                background: isExpanded ? "var(--bg-subtle)" : "transparent",
                                                transition: "background 0.15s",
                                            }}
                                        >
                                            {/* Customer */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: "32px", height: "32px", borderRadius: "50%",
                                                        background: color + "18", color,
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: "12px", fontWeight: 700, flexShrink: 0,
                                                    }}>
                                                        {initial}
                                                    </div>
                                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                                                        {customer.name ?? "—"}
                                                    </span>
                                                    <span style={{
                                                        fontSize: "10px", color: "var(--text-muted)",
                                                        transition: "transform 0.2s",
                                                        transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                                        display: "inline-block",
                                                    }}>▶</span>
                                                </div>
                                            </td>

                                            {/* Email */}
                                            <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                                {customer.email}
                                            </td>

                                            {/* Phone */}
                                            <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                                                {customer.phone ?? "—"}
                                            </td>

                                            {/* Address */}
                                            <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--text-secondary)", maxWidth: "180px" }}>
                                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {customer.address ?? "—"}
                                                </span>
                                            </td>

                                            {/* Orders */}
                                            <td style={{ padding: "14px 16px" }}>
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                                                    background: customer.orderCount > 0 ? "#dbeafe" : "var(--bg-subtle)",
                                                    color: customer.orderCount > 0 ? "#2563eb" : "var(--text-muted)",
                                                }}>
                                                    {customer.orderCount} order{customer.orderCount !== 1 ? "s" : ""}
                                                </span>
                                            </td>

                                            {/* Total Spent */}
                                            <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                                {customer.totalSpent > 0 ? `PKR ${customer.totalSpent.toLocaleString()}` : "—"}
                                            </td>

                                            {/* Joined */}
                                            <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                                {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                            </td>
                                        </tr>

                                        {/* Expanded Order History */}
                                        {isExpanded && (
                                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                                <td colSpan={7} style={{ padding: "0 16px 16px 56px", background: "var(--bg-subtle)" }}>
                                                    {customer.orders.length === 0 ? (
                                                        <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "12px 0" }}>No orders yet.</p>
                                                    ) : (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "8px" }}>
                                                            {customer.orders.map(order => {
                                                                const s = STATUS_STYLES[order.status] ?? { bg: "var(--bg-subtle)", color: "var(--text-muted)" };
                                                                return (
                                                                    <div key={order.id} style={{
                                                                        background: "var(--bg-card)", border: "1px solid var(--border)",
                                                                        borderRadius: "8px", padding: "12px 16px",
                                                                    }}>
                                                                        {/* Order Header */}
                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                                                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>
                                                                                    #{order.orderNumber}
                                                                                </span>
                                                                                <span style={{
                                                                                    padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                                                                                    background: s.bg, color: s.color,
                                                                                }}>
                                                                                    {order.status}
                                                                                </span>
                                                                            </div>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                                                                    {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                                                                </span>
                                                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                                                                                    PKR {order.total.toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Order Items */}
                                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                                            {order.items.map(item => (
                                                                                <span key={item.id} style={{
                                                                                    fontSize: "11px", padding: "2px 8px",
                                                                                    background: "var(--bg-subtle)", borderRadius: "4px",
                                                                                    color: "var(--text-secondary)",
                                                                                }}>
                                                                                    {item.name} ×{item.quantity} · PKR {item.price.toLocaleString()}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}