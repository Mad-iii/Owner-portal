import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Shared secret — your existing Express servers must send this header
const INGEST_SECRET = process.env.INGEST_SECRET!;

export async function POST(req: NextRequest) {
    // Verify the request is from your own servers
    const secret = req.headers.get("x-ingest-secret");
    if (secret !== INGEST_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, storeId, data } = body;

    // Verify this storeId exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    switch (type) {
        case "ORDER_CREATED":
            await prisma.order.create({
                data: {
                    storeId,
                    orderNumber: data.orderNumber,
                    status: "PENDING",
                    total: data.total,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail,
                    items: {
                        create: data.items.map((item: any) => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
            });
            break;

        case "ORDER_STATUS_UPDATED":
            await prisma.order.update({
                where: { id: data.orderId },
                data: { status: data.status },
            });
            break;

        case "PRODUCT_STOCK_UPDATED":
            await prisma.product.upsert({
                where: { id: data.productId ?? "new" },
                update: { stock: data.stock },
                create: {
                    storeId,
                    name: data.name,
                    sku: data.sku,
                    price: data.price,
                    stock: data.stock,
                },
            });
            break;

        case "PAGE_VISIT":
            await prisma.pageVisit.create({
                data: {
                    storeId,
                    page: data.page,
                    sessionId: data.sessionId,
                    country: data.country,
                },
            });
            break;

        case "CUSTOMER_REGISTERED":
            await prisma.customer.upsert({
                where: { storeId_email: { storeId, email: data.email } },
                update: { name: data.name },
                create: { storeId, email: data.email, name: data.name },
            });
            break;

        default:
            return NextResponse.json({ error: "Unknown event type" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}