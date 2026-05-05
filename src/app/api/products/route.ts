import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cors() {
    return { "Access-Control-Allow-Origin": "*" };
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const products = await prisma.product.findMany({ where: { storeId: session.user.storeId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const product = await prisma.product.create({
        data: { ...body, storeId: session.user.storeId },
    });
    return NextResponse.json(product);
}

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id")!;
    const body = await req.json();
    const product = await prisma.product.update({ where: { id }, data: body });
    return NextResponse.json(product);
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(req.url).searchParams.get("id")!;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}