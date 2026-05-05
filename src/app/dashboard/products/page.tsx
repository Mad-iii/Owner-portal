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
    images: string[];
    description?: string;
    materials?: string;
    active: boolean;
}

const emptyForm = {
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    img: "",
    images: ["", "", "", ""] as string[],
    description: "",
    materials: "",
    active: true,
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

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
        const imgs = [...(p.images || [])];
        while (imgs.length < 4) imgs.push("");
        setForm({
            name: p.name,
            sku: p.sku ?? "",
            price: String(p.price),
            stock: String(p.stock),
            category: p.category ?? "",
            img: p.img ?? "",
            images: imgs as [string, string, string, string],
            description: p.description ?? "",
            materials: p.materials ?? "",
            active: p.active,
        });
        setShowModal(true);
    }

    // Upload image file to Vercel Blob (or fallback: just store the URL typed in)
    async function handleImageUpload(file: File, slot: number) {
        setUploadingSlot(slot);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const { url } = await res.json();
                setImageSlot(slot, url);
            } else {
                alert("Upload failed. Paste a URL manually instead.");
            }
        } catch {
            alert("Upload failed. Paste a URL manually instead.");
        } finally {
            setUploadingSlot(null);
        }
    }

    function setImageSlot(slot: number, value: string) {
        setForm(f => {
            const imgs = [...f.images] as [string, string, string, string];
            imgs[slot] = value;
            // Keep img (main image) in sync with slot 0
            return { ...f, images: imgs, img: slot === 0 ? value : f.img };
        });
    }

    async function handleSave() {
        setSaving(true);
        const cleanImages = form.images.filter(Boolean);
        const payload = {
            name: form.name,
            sku: form.sku || null,
            price: parseFloat(form.price),
            stock: parseInt(form.stock),
            category: form.category || null,
            img: cleanImages[0] || form.img || null,
            images: cleanImages,
            description: form.description || null,
            materials: form.materials || null,
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
                            borderRadius: "12px", overflow: "hidden",
                            display: "flex", flexDirection: "column",
                        }}>
                            {/* Image strip */}
                            <div style={{ display: "flex", height: "80px", background: "var(--bg-subtle)" }}>
                                {(product.images?.length ? product.images : [product.img]).filter(Boolean).slice(0, 4).map((url, i) => (
                                    <div key={i} style={{ flex: 1, overflow: "hidden", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
                                        <img src={url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                ))}
                                {!(product.images?.length || product.img) && (
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                                        No images
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
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

                                {product.category && (
                                    <span style={{
                                        alignSelf: "flex-start", padding: "3px 8px", borderRadius: "6px",
                                        fontSize: "11px", background: "var(--blue-light)", color: "var(--blue)",
                                    }}>
                                        {product.category}
                                    </span>
                                )}

                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => openEdit(product)} style={{
                                        flex: 1, padding: "8px", borderRadius: "8px", fontSize: "12px",
                                        fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
                                        background: "var(--bg-subtle)", color: "var(--text-primary)",
                                    }}>Edit</button>
                                    <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id} style={{
                                        padding: "8px 14px", borderRadius: "8px", fontSize: "12px",
                                        fontWeight: 600, cursor: "pointer", border: "none",
                                        background: "#fee2e2", color: "#dc2626",
                                        opacity: deletingId === product.id ? 0.5 : 1,
                                    }}>
                                        {deletingId === product.id ? "..." : "Delete"}
                                    </button>
                                </div>
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

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px",
                }}>
                    <div style={{
                        background: "var(--bg-card)", borderRadius: "16px", padding: "32px",
                        width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto",
                        display: "flex", flexDirection: "column", gap: "16px",
                        border: "1px solid var(--border)",
                    }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </h2>

                        {/* Image Upload Slots */}
                        <div>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                                Product Images (up to 4) — Slot 1 is the main image
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                {[0, 1, 2, 3].map(slot => (
                                    <div key={slot} style={{
                                        border: "1px dashed var(--border)", borderRadius: "8px",
                                        overflow: "hidden", background: "var(--bg-subtle)",
                                    }}>
                                        {form.images[slot] ? (
                                            <div style={{ position: "relative" }}>
                                                <img
                                                    src={form.images[slot]}
                                                    alt={`Slot ${slot + 1}`}
                                                    style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                />
                                                <button
                                                    onClick={() => setImageSlot(slot, "")}
                                                    style={{
                                                        position: "absolute", top: "4px", right: "4px",
                                                        background: "rgba(0,0,0,0.6)", color: "white",
                                                        border: "none", borderRadius: "50%", width: "22px", height: "22px",
                                                        cursor: "pointer", fontSize: "12px", lineHeight: "22px",
                                                    }}
                                                >×</button>
                                                {slot === 0 && (
                                                    <span style={{
                                                        position: "absolute", bottom: "4px", left: "4px",
                                                        background: "var(--blue)", color: "white",
                                                        fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px",
                                                    }}>MAIN</span>
                                                )}
                                            </div>
                                        ) : (
                                            <label style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "120px", gap: "6px" }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, slot);
                                                    }}
                                                />
                                                {uploadingSlot === slot ? (
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Uploading...</span>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize: "24px", opacity: 0.3 }}>+</span>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                                            {slot === 0 ? "Main photo" : `Photo ${slot + 1}`}
                                                        </span>
                                                    </>
                                                )}
                                            </label>
                                        )}
                                        {/* URL fallback input */}
                                        <input
                                            value={form.images[slot]}
                                            onChange={(e) => setImageSlot(slot, e.target.value)}
                                            placeholder="…or paste URL"
                                            style={{
                                                width: "100%", padding: "6px 8px", fontSize: "10px",
                                                border: "none", borderTop: "1px solid var(--border)",
                                                background: "transparent", color: "var(--text-primary)",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Text Fields */}
                        {[
                            { label: "Name *", key: "name", placeholder: "e.g. Rani Haar" },
                            { label: "SKU", key: "sku", placeholder: "e.g. RH-001" },
                            { label: "Price (PKR) *", key: "price", placeholder: "e.g. 15000" },
                            { label: "Stock *", key: "stock", placeholder: "e.g. 5" },
                            { label: "Category", key: "category", placeholder: "e.g. Necklaces" },
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

                        {/* Description */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="A beautiful piece handcrafted in Lahore..."
                                rows={3}
                                style={{
                                    padding: "10px 12px", borderRadius: "8px", fontSize: "13px",
                                    border: "1px solid var(--border)", background: "var(--bg-subtle)",
                                    color: "var(--text-primary)", outline: "none", resize: "vertical",
                                }}
                            />
                        </div>

                        {/* Materials */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Materials / The Making</label>
                            <textarea
                                value={form.materials}
                                onChange={e => setForm(f => ({ ...f, materials: e.target.value }))}
                                placeholder="Sterling silver, hand-polished kundan stones..."
                                rows={2}
                                style={{
                                    padding: "10px 12px", borderRadius: "8px", fontSize: "13px",
                                    border: "1px solid var(--border)", background: "var(--bg-subtle)",
                                    color: "var(--text-primary)", outline: "none", resize: "vertical",
                                }}
                            />
                        </div>

                        {/* Active toggle */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                type="checkbox"
                                id="active"
                                checked={form.active}
                                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                            />
                            <label htmlFor="active" style={{ fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                                Active (visible in Dhanak store)
                            </label>
                        </div>

                        <div style={{ display: "flex", gap: "8px", paddingTop: "8px" }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px",
                                    fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
                                    background: "var(--bg-subtle)", color: "var(--text-primary)",
                                }}
                            >Cancel</button>
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