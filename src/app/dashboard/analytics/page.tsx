import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const [totalVisits, uniqueSessions, topPages] = await Promise.all([
        prisma.pageVisit.count({ where: { storeId } }),

        prisma.pageVisit.groupBy({
            by: ["sessionId"],
            where: { storeId },
        }).then(r => r.length),

        prisma.pageVisit.groupBy({
            by: ["page"],
            where: { storeId },
            _count: { page: true },
            orderBy: { _count: { page: "desc" } },
            take: 10,
        }),
    ]);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-400 mb-1">Total Page Views</p>
                    <p className="text-3xl font-semibold text-gray-900">{totalVisits.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm text-gray-400 mb-1">Unique Sessions</p>
                    <p className="text-3xl font-semibold text-gray-900">{uniqueSessions.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-medium text-gray-900 mb-4">Top Pages</h2>
                <div className="space-y-3">
                    {topPages.map((p: any) => {
                        const pct = Math.round((p._count.page / totalVisits) * 100);
                        return (
                            <div key={p.page}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700 font-medium">{p.page}</span>
                                    <span className="text-gray-400">{p._count.page} views</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}