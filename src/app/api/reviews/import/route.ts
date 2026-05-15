// src/app/api/reviews/import/route.ts  (Owner-portal)
// POST /api/reviews/import  — bulk CSV import from dashboard
//
// Expected CSV columns (header row required):
//   productId, productName, customerEmail, customerName, rating, title, body, createdAt
//   (customerEmail, customerName, title, createdAt are optional)
//
// Body: JSON { storeId: string, rows: CsvRow[] }
// Returns: { imported: number, skipped: number, errors: string[] }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface CsvRow {
    productId: string;
    productName?: string;
    customerEmail?: string;
    customerName?: string;
    rating: string | number;
    title?: string;
    body: string;
    createdAt?: string;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId, rows }: { storeId: string; rows: CsvRow[] } = await req.json();

    if (!storeId || !Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "storeId and rows[] are required" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Validate product IDs exist in this store
    const productIds = [...new Set(rows.map((r) => r.productId).filter(Boolean))];
    const products = await prisma.product.findMany({
        where: { id: { in: productIds }, storeId },
        select: { id: true, name: true },
    });
    const validProductMap = new Map(products.map((p) => [p.id, p.name]));

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 because row 1 is header

        const rating = Number(row.rating);
        if (!row.productId || !validProductMap.has(row.productId)) {
            errors.push(`Row ${rowNum}: productId "${row.productId}" not found in this store`);
            skipped++;
            continue;
        }
        if (!row.body || row.body.trim() === "") {
            errors.push(`Row ${rowNum}: body is required`);
            skipped++;
            continue;
        }
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push(`Row ${rowNum}: rating must be 1-5, got "${row.rating}"`);
            skipped++;
            continue;
        }

        try {
            await prisma.review.create({
                data: {
                    storeId,
                    productId: row.productId,
                    productName: row.productName ?? validProductMap.get(row.productId)!,
                    customerEmail: row.customerEmail?.trim() || null,
                    customerName: row.customerName?.trim() || null,
                    rating,
                    title: row.title?.trim() || null,
                    body: row.body.trim(),
                    verified: true,   // all reviews verified per your decision
                    source: "csv",
                    status: "published",
                    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                },
            });
            imported++;
        } catch (err: any) {
            errors.push(`Row ${rowNum}: ${err.message ?? "unknown error"}`);
            skipped++;
        }
    }

    return NextResponse.json({ imported, skipped, errors });
}