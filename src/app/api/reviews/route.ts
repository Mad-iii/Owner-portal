// src/app/api/reviews/route.ts  (Owner-portal)
// Handles:
//   GET  /api/reviews?storeId=&productId=&rating=&source=&page=&limit=
//   POST /api/reviews   — create a single organic review (called by Dhanak)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust to your prisma client path
import { auth } from "@/lib/auth";

// ─── GET — list reviews ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") ?? undefined;
    const productId = searchParams.get("productId") ?? undefined;
    const rating = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;
    const source = searchParams.get("source") ?? undefined;
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Number(searchParams.get("limit") ?? 20));
    const skip = (page - 1) * limit;

    // For Dhanak public requests, no auth needed — just productId scoped
    // For Owner-portal dashboard requests, storeId is required & session checked
    const calledFromDashboard = searchParams.get("dashboard") === "1";
    if (calledFromDashboard) {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: Record<string, unknown> = { status: "published" };
    if (storeId) where.storeId = storeId;
    if (productId) where.productId = productId;
    if (rating) where.rating = rating;
    if (source) where.source = source;

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.review.count({ where }),
    ]);

    // Aggregate stats
    const stats = await prisma.review.aggregate({
        where: { storeId: where.storeId as string | undefined, productId: where.productId as string | undefined, status: "published" },
        _avg: { rating: true },
        _count: { id: true },
    });

    const starBreakdown = await prisma.review.groupBy({
        by: ["rating"],
        where: { storeId: where.storeId as string | undefined, productId: where.productId as string | undefined, status: "published" },
        _count: { id: true },
    });

    return NextResponse.json({
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        totalReviews: stats._count.id,
        starBreakdown: [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: starBreakdown.find((s) => s.rating === star)?._count.id ?? 0,
        })),
    });
}

// ─── POST — create organic review (called by Dhanak server) ─────────────────
export async function POST(req: NextRequest) {
    // Dhanak calls this from its own server with a shared secret header
    const secret = req.headers.get("x-api-secret");
    if (secret !== process.env.DHANAK_API_SECRET) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { storeId, productId, productName, orderId, customerEmail, customerName, rating, title, reviewBody } = body;

    if (!storeId || !productId || !productName || !rating || !reviewBody) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Duplicate check — one organic review per customer per product
    if (customerEmail) {
        const existing = await prisma.review.findFirst({
            where: { storeId, productId, customerEmail, source: "organic" },
        });
        if (existing) {
            return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
        }
    }

    const review = await prisma.review.create({
        data: {
            storeId,
            productId,
            productName,
            orderId: orderId ?? null,
            customerEmail: customerEmail ?? null,
            customerName: customerName ?? null,
            rating: Number(rating),
            title: title ?? null,
            body: reviewBody,
            verified: true,  // all reviews are verified per your decision
            source: "organic",
            status: "published",
        },
    });

    return NextResponse.json({ review }, { status: 201 });
}