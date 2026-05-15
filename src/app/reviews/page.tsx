// src/app/reviews/page.tsx  (Owner-portal)
// Server component — fetches initial data and passes to client

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReviewsClient from "./ReviewsClient";

export default async function ReviewsPage({
    searchParams,
}: {
    searchParams: { productId?: string; rating?: string; source?: string; page?: string };
}) {
    const session = await auth();
    if (!session) redirect("/login");

    // Get store from session (adjust field name to match your auth setup)
    const storeId = (session as any).user?.storeId ?? (session as any).storeId;
    if (!storeId) redirect("/login");

    const page = Math.max(1, Number(searchParams.page ?? 1));
    const limit = 20;
    const skip = (page - 1) * limit;
    const productId = searchParams.productId ?? undefined;
    const rating = searchParams.rating ? Number(searchParams.rating) : undefined;
    const source = searchParams.source ?? undefined;

    const where: Record<string, unknown> = { storeId };
    if (productId) where.productId = productId;
    if (rating) where.rating = rating;
    if (source) where.source = source;

    const [reviews, total, stats, starBreakdown, products] = await Promise.all([
        prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.review.count({ where }),
        prisma.review.aggregate({
            where: { storeId },
            _avg: { rating: true },
            _count: { id: true },
        }),
        prisma.review.groupBy({
            by: ["rating"],
            where: { storeId },
            _count: { id: true },
        }),
        prisma.product.findMany({
            where: { storeId, active: true },
            select: { id: true, name: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const starBreakdownFormatted = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: starBreakdown.find((s) => s.rating === star)?._count.id ?? 0,
    }));

    return (
        <ReviewsClient
            reviews={JSON.parse(JSON.stringify(reviews))}
            total={total}
            page={page}
            totalPages={Math.ceil(total / limit)}
            averageRating={stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0}
            totalReviews={stats._count.id}
            starBreakdown={starBreakdownFormatted}
            products={products}
            storeId={storeId}
            filters={{ productId, rating, source }}
        />
    );
}