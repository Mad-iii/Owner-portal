"use client";

import React, { useEffect, useState } from "react";

interface Product {
    id: string;
    name: string;
    sku?: string;
    price: number;
    stock: number;
    category?: string;
    img?: string;
    active: boolean;
}

const emptyForm = { name: "", sku: "", price: "", stock: "", category: "", img: "", active: true };

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function loadProducts() {
        setLoading(true);
        const res = await fetch("/api/products");
        if (res.ok) setProducts(await res.json());
        setLoading(false);
    }

    useEffect(() => { loadProducts(); }, []);

    function openAdd() {
        setEditingProduct(null);
        setForm(emptyForm);
        setShowModal(true);
    }

    function openEdit(p: Product) {
        setEditingProduct(p);
        setForm({
            name: p.name,
            sku: p.sku ?? "",
            price: String(p.price),
            stock: String(p.stock),
            category: p.category ?? "",
            img: p.img ?? "",
            active: p.active as any,
        });
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        const payload = {
            name: form.name,
            sku: form.sku || null,
            price: parseFloat(form.price),
            stock: parseInt(form.stock),
            category: form.category || null,
            img: form.img || null,
            active: form.active,
        };

        if (editingProduct) {
            await fetch(`/api/products?id=${editingProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        } else {
            await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
        }

        setSaving(false);
        setShowModal(false);
        loadProducts();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this product?")) return;
        setDeletingId(id);
        await fetch(`/api/products?id=${id}`, { method: "DELETE" });
        setDeletingId(null);
        loadProducts();
    }

    return (
        <div style={{ padding: "32px" }}>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Products</h1>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{products.length} products in your catalogue</p>
                </div>
                <button
                    onClick={openAdd}
                    style={{
                        background: "var(--blue)", color: "white", border: "none",
                        padding: "10px 20px", borderRadius: "8px", fontSize: "13px",
                        fontWeight: 600, cursor: "pointer",
                    }}
                >
                    + Add Product
                </button>
            </div>

            {loading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {products.map((product) => (
                        <div key={product.id} style={{
                            background: "var(--bg-card)", border: "1px solid var(--border)",
                            borderRadius: "12px", padding: "20px",
                            display: "flex", flexDirection: "column", gap: "12px",
                        }}>
                            {/* Name + Status */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, flex: 1, marginRight: "8px" }}>
                                    {product.name}
                                </h3>
                                <span style={{
                                    padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, flexShrink: 0,
                                    background: product.active ? "#dcfce7" : "var(--bg-subtle)",
                                    color: product.active ? "#16a34a" : "var(--text-muted)",
                                }}>
                                    {product.active ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {product.sku && (
                                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>SKU: {product.sku}</p>
                            )}

                            {product.category && (
                                <span style={{
                                    alignSelf: "flex-start", padding: "3px 8px", borderRadius: "6px",
                                    fontSize: "11px", background: "var(--blue-light)", color: "var(--blue)",
                                }}>
                                    {product.category}
                                </span>
                            )}

                            {/* Price + Stock */}
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--blue)" }}>
                                    PKR {product.price.toLocaleString()}
                                </span>
                                <span style={{
                                    fontSize: "12px", fontWeight: 500,
                                    color: product.stock < 10 ? "#dc2626" : "var(--text-secondary)",
                                    background: product.stock < 10 ? "#fee2e2" : "var(--bg-subtle)",
                                    padding: "3px 8px", borderRadius: "6px",
                                }}>
                                    {product.stock} in stock
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                                <button
                                    onClick={() => openEdit(product)}
                                    style={{
                                        flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px",
                                        fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
                                        background: "var(--bg-subtle)", color: "var(--text-primary)",
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    disabled={deletingId === product.id}
                                    style={{
                                        padding: "8px 14px", borderRadius: "8px", fontSize: "12px",
                                        fontWeight: 600, cursor: "pointer", border: "none",
                                        background: "#fee2e2", color: "#dc2626",
                                        opacity: deletingId === product.id ? 0.5 : 1,
                                    }}
                                >
                                    {deletingId === product.id ? "..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    ))}

                    {products.length === 0 && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>
                            No products yet. Click <strong>+ Add Product</strong> to get started.
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{
                        background: "var(--bg-card)", borderRadius: "16px", padding: "32px",
                        width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px",
                        border: "1px solid var(--border)",
                    }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </h2>

                        {[
                            { label: "Name *", key: "name", placeholder: "e.g. Rani Haar" },
                            { label: "SKU", key: "sku", placeholder: "e.g. RH-001" },
                            { label: "Price (PKR) *", key: "price", placeholder: "e.g. 15000" },
                            { label: "Stock *", key: "stock", placeholder: "e.g. 5" },
                            { label: "Category", key: "category", placeholder: "e.g. Necklaces" },
                            { label: "Image URL", key: "img", placeholder: "https://..." },
                        ].map(({ label, key, placeholder }) => (
                            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>{label}</label>
                                <input
                                    value={(form as any)[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                    style={{
                                        padding: "10px 12px", borderRadius: "8px", fontSize: "13px",
                                        border: "1px solid var(--border)", background: "var(--bg-subtle)",
                                        color: "var(--text-primary)", outline: "none",
                                    }}
                                />
                            </div>
                        ))}

                        {/* Active toggle */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="checkbox"
                                id="active"
                                checked={form.active as any}
                                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                            />
                            <label htmlFor="active" style={{ fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                                Active (visible in Dhanak store)
                            </label>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", gap: "8px", paddingTop: "8px" }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px",
                                    fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
                                    background: "var(--bg-subtle)", color: "var(--text-primary)",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.name || !form.price || !form.stock}
                                style={{
                                    flex: 2, padding: "10px", borderRadius: "8px", fontSize: "13px",
                                    fontWeight: 600, cursor: "pointer", border: "none",
                                    background: "var(--blue)", color: "white",
                                    opacity: saving || !form.name || !form.price || !form.stock ? 0.5 : 1,
                                }}
                            >
                                {saving ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}