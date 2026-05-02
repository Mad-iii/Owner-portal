// ==================== PRODUCTS PAGE ====================
// src/app/dashboard/products/page.tsx

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const products = await prisma.product.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Products</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{products.length} products in your catalogue</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {products.map((product: any) => (
                    <div key={product.id} style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex", flexDirection: "column", gap: "12px",
                    }}>
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
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "DM Mono, monospace" }}>SKU: {product.sku}</p>
                        )}

                        {product.category && (
                            <span style={{
                                alignSelf: "flex-start", padding: "3px 8px", borderRadius: "6px",
                                fontSize: "11px", background: "var(--blue-light)", color: "var(--blue)",
                            }}>
                                {product.category}
                            </span>
                        )}

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
                    </div>
                ))}
                {products.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "64px", color: "var(--text-muted)", fontSize: "14px" }}>
                        No products yet.
                    </div>
                )}
            </div>
        </div>
    );
}