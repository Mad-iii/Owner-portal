import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Eye, Users, MousePointer } from "lucide-react";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const [totalVisits, topPages, uniqueSessions] = await Promise.all([
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
    ]);

    const maxViews = topPages[0]?._count?.page ?? 1;

    const stats = [
        { label: "Total Page Views", value: totalVisits.toLocaleString(), icon: Eye, color: "#2563eb" },
        { label: "Unique Sessions", value: uniqueSessions.toLocaleString(), icon: Users, color: "#7c3aed" },
        { label: "Pages Tracked", value: topPages.length.toLocaleString(), icon: MousePointer, color: "#0891b2" },
    ];

    return (
        <div style={{ padding: "32px" }}>
            <div style={{ marginBottom: "24px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Analytics</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Page visit data from your store</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "20px",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</p>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "8px",
                                background: stat.color + "18",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <stat.icon size={15} color={stat.color} />
                            </div>
                        </div>
                        <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Top pages */}
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
            }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                    <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Top Pages</h2>
                </div>
                <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {topPages.map((p: any) => {
                        const pct = Math.round((p._count.page / maxViews) * 100);
                        return (
                            <div key={p.page}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "DM Mono, monospace" }}>
                                        {p.page}
                                    </span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                                        {p._count.page.toLocaleString()} views
                                    </span>
                                </div>
                                <div style={{ height: "6px", background: "var(--bg-subtle)", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", width: `${pct}%`,
                                        background: "linear-gradient(90deg, #2563eb, #60a5fa)",
                                        borderRadius: "3px",
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                    {topPages.length === 0 && (
                        <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>No visits tracked yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}