// src/app/dashboard/products/page.tsx
"use client";

import { useEffect, useState } from "react";

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

    async function loadProducts() {
        const res = await fetch("/api/products/manage");
        const data = await res.json();
        setProducts(data);
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
        setForm({ name: p.name, sku: p.sku ?? "", price: String(p.price), stock: String(p.stock), category: p.category ?? "", img: p.img ?? "", active: p.active });
        setShowModal(true);
    }

    async function handleSave() {
        setSaving(true);
        const body = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
        const url = editingProduct ? `/api/products/manage?id=${editingProduct.id}` : "/api/products/manage";
        const method = editingProduct ? "PUT" : "POST";
        await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        setSaving(false);
        setShowModal(false);
        loadProducts();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this product?")) return;
        await fetch(`/api/products/manage?id=${id}`, { method: "DELETE" });
        loadProducts();
    }

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Products</h1>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{products.length} products in your catalogue</p>
                </div>
                <button onClick={openAdd} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    + Add Product
                </button>
            </div>

            {loading ? (
                <p style={{ color: "var(--text-muted)" }}>Loading...</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                    {products.map((product) => (
                        <div key={product.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {product.img && (
                                <img src={product.img} alt={product.name} style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px" }} />
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", flex: 1, marginRight: "8px" }}>{product.name}</h3>
                                <span style={{ padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, flexShrink: 0, background: product.active ? "#dcfce7" : "var(--bg-subtle)", color: product.active ? "#16a34a" : "var(--text-muted)" }}>
                                    {product.active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            {product.category && (
                                <span style={{ alignSelf: "flex-start", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", background: "var(--blue-light)", color: "var(--blue)" }}>{product.category}</span>
                            )}
                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--blue)" }}>PKR {product.price.toLocaleString()}</span>
                                <span style={{ fontSize: "12px", fontWeight: 500, color: product.stock < 10 ? "#dc2626" : "var(--text-secondary)", background: product.stock < 10 ? "#fee2e2" : "var(--bg-subtle)", padding: "3px 8px", borderRadius: "6px" }}>
                                    {product.stock} in stock
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button onClick={() => openEdit(product)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => handleDelete(product.id)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #fee2e2", background: "#fee2e2", color: "#dc2626", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Delete</button>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>No products yet.</div>
                    )}
                </div>
            )}

            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
                    <div style={{ background: "var(--bg-card)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>{editingProduct ? "Edit Product" : "Add Product"}</h2>
                        {[
                            { label: "Name *", key: "name", type: "text" },
                            { label: "SKU", key: "sku", type: "text" },
                            { label: "Price (PKR) *", key: "price", type: "number" },
                            { label: "Stock *", key: "stock", type: "number" },
                            { label: "Category", key: "category", type: "text" },
                            { label: "Image URL", key: "img", type: "text" },
                        ].map(({ label, key, type }) => (
                            <div key={key}>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>{label}</label>
                                <input
                                    type={type}
                                    value={(form as any)[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontSize: "13px", boxSizing: "border-box" }}
                                />
                            </div>
                        ))}
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                            <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                            Active (visible on site)
                        </label>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "var(--blue)", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}