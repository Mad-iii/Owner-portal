import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get("store");
    if (!slug) return NextResponse.json({ error: "Missing ?store= param" }, { status: 400, headers: corsHeaders() });

    const store = await prisma.store.findUnique({ where: { slug } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404, headers: corsHeaders() });

    const products = await prisma.product.findMany({
        where: { storeId: store.id, active: true },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            category: true,
            img: true,
            images: true,       // ← new
            description: true,  // ← new
            materials: true,    // ← new
            sku: true,
        },
    });

    return NextResponse.json(products, { headers: corsHeaders() });
}