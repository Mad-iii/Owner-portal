import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Eye, Users, MousePointer, TrendingUp, ShoppingCart, CheckCircle } from "lucide-react";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const [totalVisits, topPages, uniqueSessions, orderStats, revenueByStatus] =
        await Promise.all([
            prisma.pageVisit.count({ where: { storeId } }),

            prisma.pageVisit.groupBy({
                by: ["page"],
                where: { storeId },
                _count: { page: true },
                orderBy: { _count: { page: "desc" } },
                take: 10,
            }),

            prisma.pageVisit.groupBy({
                by: ["sessionId"],
                where: { storeId },
            }).then(r => r.length),

            prisma.order.groupBy({
                by: ["status"],
                where: { storeId },
                _count: { id: true },
                _sum: { total: true },
            }),

            prisma.order.aggregate({
                where: { storeId, status: "DELIVERED" },
                _sum: { total: true },
                _count: { id: true },
            }),
        ]);

    const maxViews = topPages[0]?._count?.page ?? 1;

    const totalOrders = orderStats.reduce((sum, s) => sum + s._count.id, 0);
    const deliveredOrders = revenueByStatus._count.id;
    const deliveredRevenue = revenueByStatus._sum.total ?? 0;

    const orderStatusData = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(status => {
        const found = orderStats.find(s => s.status === status);
        return { status, count: found?._count.id ?? 0, total: found?._sum.total ?? 0 };
    });

    const statusColors: Record<string, string> = {
        PENDING: "#a16207",
        PROCESSING: "#7c3aed",
        SHIPPED: "#2563eb",
        DELIVERED: "#16a34a",
        CANCELLED: "#dc2626",
    };

    const stats = [
        { label: "Total Page Views", value: totalVisits.toLocaleString(), icon: Eye, color: "#2563eb" },
        { label: "Unique Sessions", value: uniqueSessions.toLocaleString(), icon: Users, color: "#7c3aed" },
        { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingCart, color: "#0891b2" },
        { label: "Delivered Orders", value: deliveredOrders.toLocaleString(), icon: CheckCircle, color: "#059669" },
        { label: "Delivered Revenue", value: `PKR ${deliveredRevenue.toLocaleString()}`, icon: TrendingUp, color: "#16a34a" },
        { label: "Pages Tracked", value: topPages.length.toLocaleString(), icon: MousePointer, color: "#d97706" },
    ];

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Analytics</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Store performance and visitor data</p>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: stat.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <stat.icon size={15} color={stat.color} />
                            </div>
                        </div>
                        <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                {/* Order status breakdown */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Orders by Status</h2>
                    </div>
                    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {orderStatusData.map(({ status, count, total }) => (
                            <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{
                                        padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                                        background: statusColors[status] + "18", color: statusColors[status],
                                    }}>{status}</span>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{count}</span>
                                    {total > 0 && <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>PKR {total.toLocaleString()}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top pages */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Top Pages</h2>
                    </div>
                    <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        {topPages.map((p: any) => {
                            const pct = Math.round((p._count.page / maxViews) * 100);
                            return (
                                <div key={p.page}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "monospace" }}>{p.page}</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{p._count.page}</span>
                                    </div>
                                    <div style={{ height: "5px", background: "var(--bg-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #2563eb, #60a5fa)", borderRadius: "3px" }} />
                                    </div>
                                </div>
                            );
                        })}
                        {topPages.length === 0 && (
                            <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "14px" }}>No visits yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}