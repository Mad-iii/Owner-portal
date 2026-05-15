import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INGEST_SECRET = process.env.INGEST_SECRET!;

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-ingest-secret",
    };
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
    const secret = req.headers.get("x-ingest-secret");
    if (secret !== INGEST_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }

    const body = await req.json();
    const { type, storeId, data } = body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
        return NextResponse.json({ error: "Store not found" }, { status: 404, headers: corsHeaders() });
    }

    switch (type) {
        case "ORDER_CREATED": {
            await prisma.order.create({
                data: {
                    storeId,
                    orderNumber: data.orderNumber,
                    status: "PENDING",
                    total: data.total,
                    customerName: data.customerName,
                    customerEmail: data.customerEmail ?? null,
                    address: data.address,
                    phone: data.phone,
                    items: {
                        create: (data.items ?? []).map((item: any) => ({
                            name: item.name,
                            quantity: item.quantity,
                            price: item.price,
                            productId: item.productId ?? null,
                        })),
                    },
                },
            });

            // Upsert customer — create if new, update contact info if returning
            // orderCount/totalSpend only increment on DELIVERED (see ORDER_STATUS_UPDATED)
            if (data.customerEmail) {
                await prisma.customer.upsert({
                    where: { storeId_email: { storeId, email: data.customerEmail } },
                    update: {
                        name: data.customerName ?? undefined,
                        phone: data.phone ?? undefined,
                        address: data.address ?? undefined,
                    },
                    create: {
                        storeId,
                        email: data.customerEmail,
                        name: data.customerName ?? null,
                        phone: data.phone ?? null,
                        address: data.address ?? null,
                        orderCount: 0,
                        totalSpend: 0,
                    },
                });
            }
            break;
        }

        case "ORDER_STATUS_UPDATED": {
            // Find the order first so we know the email and total
            const order = await prisma.order.findUnique({
                where: { id: data.orderId },
            });

            if (!order) {
                return NextResponse.json({ error: "Order not found" }, { status: 404, headers: corsHeaders() });
            }

            // Update the order status
            await prisma.order.update({
                where: { id: data.orderId },
                data: { status: data.status },
            });

            // When an order is marked DELIVERED, increment the customer's stats
            if (data.status === "DELIVERED" && order.customerEmail) {
                await prisma.customer.upsert({
                    where: { storeId_email: { storeId, email: order.customerEmail } },
                    update: {
                        orderCount: { increment: 1 },
                        totalSpend: { increment: order.total },
                    },
                    create: {
                        storeId,
                        email: order.customerEmail,
                        name: order.customerName ?? null,
                        orderCount: 1,
                        totalSpend: order.total,
                    },
                });
            }

            // If an order was previously DELIVERED and is now changed (e.g. CANCELLED),
            // decrement the stats so the numbers stay accurate
            if (order.status === "DELIVERED" && data.status !== "DELIVERED" && order.customerEmail) {
                await prisma.customer.updateMany({
                    where: { storeId, email: order.customerEmail },
                    data: {
                        orderCount: { decrement: 1 },
                        totalSpend: { decrement: order.total },
                    },
                });
            }
            break;
        }

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
                create: {
                    storeId,
                    email: data.email,
                    name: data.name,
                    orderCount: 0,
                    totalSpend: 0,
                },
            });
            break;

        default:
            return NextResponse.json({ error: "Unknown event type" }, { status: 400, headers: corsHeaders() });
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}