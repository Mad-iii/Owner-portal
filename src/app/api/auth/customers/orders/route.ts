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
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const storeSlug = searchParams.get("store");

    if (!email || !storeSlug) {
        return NextResponse.json({ error: "Missing params" }, { status: 400, headers: corsHeaders() });
    }

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404, headers: corsHeaders() });
    }

    const orders = await prisma.order.findMany({
        where: { storeId: store.id, customerEmail: email },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders, { headers: corsHeaders() });
}