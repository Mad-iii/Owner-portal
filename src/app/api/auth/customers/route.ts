import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export async function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
    const { email, name, phone, storeSlug } = await req.json();

    if (!email || !storeSlug) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400, headers: corsHeaders() });
    }

    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404, headers: corsHeaders() });
    }

    // Upsert — safe to call on every login
    await prisma.customer.upsert({
        where: { storeId_email: { storeId: store.id, email } },
        update: { name: name ?? undefined, phone: phone ?? undefined },
        create: { storeId: store.id, email, name: name ?? null, phone: phone ?? null },
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}