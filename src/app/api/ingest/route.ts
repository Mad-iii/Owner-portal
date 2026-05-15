import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL = process.env.OWNER_EMAIL!;
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

// ── Email Templates ────────────────────────────────────────────────────────────

function ownerNewOrderEmail(data: any) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A0A00;padding:32px;text-align:center">
        <h1 style="color:#FFE600;font-size:28px;margin:0;letter-spacing:3px">DHANAK</h1>
        <p style="color:#fff;margin:10px 0 0;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:2px">New Order Received</p>
      </div>
      <div style="padding:32px">
        <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #FFE600">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Order Number</p>
          <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#111">${data.orderNumber}</p>
        </div>

        <h2 style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Customer Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
          <tr><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:110px">Name</td><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:13px">${data.customerName ?? "—"}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Email</td><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:13px">${data.customerEmail ?? "—"}</td></tr>
          <tr><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">Phone</td><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:13px">${data.phone ?? "—"}</td></tr>
          <tr><td style="padding:9px 0;color:#6b7280;font-size:13px">Address</td><td style="padding:9px 0;font-weight:600;font-size:13px">${data.address ?? "—"}</td></tr>
        </table>

        <h2 style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Items Ordered</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;border-radius:6px 0 0 6px">Item</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;border-radius:0 6px 6px 0">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items ?? []).map((item: any) => `
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:12px;font-size:13px;font-weight:500">${item.name}</td>
                <td style="padding:12px;text-align:center;font-size:13px;color:#6b7280">×${item.quantity}</td>
                <td style="padding:12px;text-align:right;font-size:13px;font-weight:600">PKR ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div style="background:#1A0A00;border-radius:8px;padding:20px 24px;margin-bottom:28px">
          <table style="width:100%">
            <tr>
              <td style="color:#fff;font-size:14px;font-weight:600">Total</td>
              <td style="text-align:right;color:#FFE600;font-size:24px;font-weight:800">PKR ${Number(data.total).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0">
          Manage this order at <a href="https://owner-portal-ten.vercel.app" style="color:#1A0A00;font-weight:700;text-decoration:none">Owner Portal →</a>
        </p>
      </div>
    </div>`;
}

function customerOrderConfirmedEmail(data: any) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A0A00;padding:32px;text-align:center">
        <h1 style="color:#FFE600;font-size:28px;margin:0;letter-spacing:3px">DHANAK</h1>
        <p style="color:#fff;margin:10px 0 0;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:2px">Order Confirmed</p>
      </div>
      <div style="padding:32px">
        <p style="font-size:16px;color:#111;font-weight:600;margin:0 0 8px">Thank you, ${data.customerName?.split(" ")[0] ?? "there"}! 🎉</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6">Your order has been received and is being prepared with heritage and soul. We'll notify you once it's on its way.</p>

        <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #FFE600">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Order Number</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#111">${data.orderNumber}</p>
        </div>

        <h2 style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Your Items</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">Item</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600">Price</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items ?? []).map((item: any) => `
              <tr style="border-bottom:1px solid #f3f4f6">
                <td style="padding:12px;font-size:13px;font-weight:500">${item.name}</td>
                <td style="padding:12px;text-align:center;font-size:13px;color:#6b7280">×${item.quantity}</td>
                <td style="padding:12px;text-align:right;font-size:13px;font-weight:600">PKR ${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;width:110px">Delivery to</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-weight:600;font-size:13px">${data.address ?? "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Phone</td><td style="padding:8px 0;font-weight:600;font-size:13px">${data.phone ?? "—"}</td></tr>
        </table>

        <div style="background:#1A0A00;border-radius:8px;padding:20px 24px;margin-bottom:28px">
          <table style="width:100%">
            <tr>
              <td style="color:#fff;font-size:14px;font-weight:600">Total</td>
              <td style="text-align:right;color:#FFE600;font-size:24px;font-weight:800">PKR ${Number(data.total).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:12px;color:#9ca3af;text-align:center;margin:0">Questions? Reply to this email or reach us at dhanak.store</p>
      </div>
    </div>`;
}

function customerShippedEmail(order: any) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A0A00;padding:32px;text-align:center">
        <h1 style="color:#FFE600;font-size:28px;margin:0;letter-spacing:3px">DHANAK</h1>
        <p style="color:#fff;margin:10px 0 0;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:2px">Your Order is On Its Way</p>
      </div>
      <div style="padding:32px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">🚚</div>
        <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 12px">It's been dispatched!</h2>
        <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;max-width:400px;margin-left:auto;margin-right:auto">Your Dhanak order <strong>${order.orderNumber}</strong> is on its way to you. Expect it to arrive within 2–5 business days.</p>

        <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #FFE600;text-align:left">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Delivering to</p>
          <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#111">${order.customerName ?? "—"}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280">${order.address ?? "—"}</p>
        </div>

        <div style="background:#1A0A00;border-radius:8px;padding:20px 24px;margin-bottom:28px">
          <table style="width:100%">
            <tr>
              <td style="color:#fff;font-size:14px;font-weight:600;text-align:left">Order Total</td>
              <td style="text-align:right;color:#FFE600;font-size:22px;font-weight:800">PKR ${Number(order.total).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <p style="font-size:12px;color:#9ca3af;margin:0">Questions? Reach us at dhanak.store</p>
      </div>
    </div>`;
}

function customerDeliveredEmail(order: any) {
    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
      <div style="background:#1A0A00;padding:32px;text-align:center">
        <h1 style="color:#FFE600;font-size:28px;margin:0;letter-spacing:3px">DHANAK</h1>
        <p style="color:#fff;margin:10px 0 0;font-size:13px;opacity:0.6;text-transform:uppercase;letter-spacing:2px">Order Delivered</p>
      </div>
      <div style="padding:32px;text-align:center">
        <div style="font-size:56px;margin-bottom:16px">✨</div>
        <h2 style="font-size:22px;font-weight:800;color:#111;margin:0 0 12px">Your order has arrived!</h2>
        <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;max-width:400px;margin-left:auto;margin-right:auto">We hope you love your Dhanak pieces. If you enjoyed your experience, we'd love to hear from you — leave a review on the product page!</p>

        <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #FFE600;text-align:left">
          <p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Order Number</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:800;color:#111">${order.orderNumber}</p>
        </div>

        <a href="https://dhanak.vercel.app/shop" style="display:inline-block;background:#FFE600;color:#1A0A00;font-weight:800;font-size:13px;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px">Shop Again →</a>

        <p style="font-size:12px;color:#9ca3af;margin:0">Thank you for choosing Dhanak 🌈</p>
      </div>
    </div>`;
}

// ── Main Handler ───────────────────────────────────────────────────────────────

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

            // Email: owner notification
            await resend.emails.send({
                from: "Dhanak Orders <onboarding@resend.dev>",
                to: OWNER_EMAIL,
                subject: `🛍️ New Order ${data.orderNumber} — PKR ${Number(data.total).toLocaleString()}`,
                html: ownerNewOrderEmail(data),
            });

            // Email: customer confirmation
            if (data.customerEmail) {
                await resend.emails.send({
                    from: "Dhanak <onboarding@resend.dev>",
                    to: data.customerEmail,
                    subject: `✅ Order Confirmed — ${data.orderNumber}`,
                    html: customerOrderConfirmedEmail(data),
                });
            }

            break;
        }

        case "ORDER_STATUS_UPDATED": {
            const order = await prisma.order.findUnique({
                where: { id: data.orderId },
            });

            if (!order) {
                return NextResponse.json({ error: "Order not found" }, { status: 404, headers: corsHeaders() });
            }

            await prisma.order.update({
                where: { id: data.orderId },
                data: { status: data.status },
            });

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

                // Email: customer delivered
                await resend.emails.send({
                    from: "Dhanak <onboarding@resend.dev>",
                    to: order.customerEmail,
                    subject: `✨ Your Dhanak order has been delivered!`,
                    html: customerDeliveredEmail(order),
                });
            }

            if (order.status === "DELIVERED" && data.status !== "DELIVERED" && order.customerEmail) {
                await prisma.customer.updateMany({
                    where: { storeId, email: order.customerEmail },
                    data: {
                        orderCount: { decrement: 1 },
                        totalSpend: { decrement: order.total },
                    },
                });
            }

            // Email: customer shipped
            if (data.status === "SHIPPED" && order.status !== "SHIPPED" && order.customerEmail) {
                await resend.emails.send({
                    from: "Dhanak <onboarding@resend.dev>",
                    to: order.customerEmail,
                    subject: `🚚 Your Dhanak order is on its way!`,
                    html: customerShippedEmail(order),
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