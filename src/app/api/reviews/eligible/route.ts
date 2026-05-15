// src/app/api/reviews/eligible/route.ts  (Owner-portal)
// GET /api/reviews/eligible?storeId=&productId=&customerEmail=
//
// Dhanak calls this from its server before showing the review form.
// Returns: { eligible: boolean, reason?: string, alreadyReviewed: boolean }
//
// A customer is eligible if they have at least one DELIVERED order
// containing an OrderItem with productId matching the target product.
//
// NOTE: This requires OrderItem.productId to exist (added in migration_add_reviews.sql).
// If you haven't added productId to OrderItem yet, see the fallback approach below.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const productId = searchParams.get("productId");
    const customerEmail = searchParams.get("customerEmail");

    // Light auth: require the shared secret so Dhanak's server is the only caller
    const secret = req.headers.get("x-api-secret");
    if (secret !== process.env.DHANAK_API_SECRET) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!storeId || !productId || !customerEmail) {
        return NextResponse.json({ error: "storeId, productId, customerEmail required" }, { status: 400 });
    }

    // Check if already reviewed
    const alreadyReviewed = !!(await prisma.review.findFirst({
        where: { storeId, productId, customerEmail, source: "organic" },
    }));

    if (alreadyReviewed) {
        return NextResponse.json({ eligible: false, alreadyReviewed: true, reason: "already_reviewed" });
    }

    // ── Primary check: via OrderItem.productId (needs migration) ──────────────
    const deliveredOrder = await prisma.order.findFirst({
        where: {
            storeId,
            customerEmail,
            status: { in: ["DELIVERED"] },
            items: {
                some: { productId },
            },
        },
        select: { id: true },
    });

    // ── Fallback: if you haven't added productId to OrderItem yet,
    //    use product name matching (less reliable but works without migration):
    //
    // const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
    // const deliveredOrder = await prisma.order.findFirst({
    //   where: {
    //     storeId,
    //     customerEmail,
    //     status: { in: ["DELIVERED"] },
    //     items: { some: { name: { contains: product?.name ?? "", mode: "insensitive" } } },
    //   },
    //   select: { id: true },
    // });

    if (!deliveredOrder) {
        return NextResponse.json({
            eligible: false,
            alreadyReviewed: false,
            reason: "no_delivered_order",
        });
    }

    return NextResponse.json({
        eligible: true,
        alreadyReviewed: false,
        orderId: deliveredOrder.id,
    });
}