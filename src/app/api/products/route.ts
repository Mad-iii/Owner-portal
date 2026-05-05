import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function OPTIONS() {
    return new NextResponse(null, { headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const storeSlug = searchParams.get('store');

        if (!storeSlug) {
            return NextResponse.json(
                { error: 'Missing ?store= param' },
                { status: 400, headers: corsHeaders() }
            );
        }

        const products = await prisma.product.findMany({
            where: {
                store: { slug: storeSlug },
                active: true,
            },
            select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                stock: true,
                category: true,
                img: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(products, { headers: corsHeaders() });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500, headers: corsHeaders() }
        );
    }
}