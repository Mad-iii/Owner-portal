import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    const { prisma } = await import("../src/lib/prisma");

    const storeId = "cmoo7lrmb0000r0ilixv4nigv"; // your BoxIt store ID

    // Seed orders
    const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    const names = ["Ahmed Khan", "Sara Ali", "Bilal Mahmood", "Fatima Zahra", "Omar Sheikh"];

    for (let i = 1; i <= 20; i++) {
        await prisma.order.create({
            data: {
                storeId,
                orderNumber: `BOXIT-${1000 + i}`,
                status: statuses[i % 5] as any,
                total: Math.floor(Math.random() * 5000) + 500,
                customerName: names[i % 5],
                customerEmail: `customer${i}@example.com`,
                items: {
                    create: [
                        { name: "Gift Basket - Premium", quantity: 1, price: 2500 },
                        { name: "Chocolate Box", quantity: 2, price: 800 },
                    ],
                },
            },
        });
    }

    // Seed customers
    for (let i = 0; i < 5; i++) {
        await prisma.customer.upsert({
            where: { storeId_email: { storeId, email: `customer${i}@example.com` } },
            update: {},
            create: {
                storeId,
                email: `customer${i}@example.com`,
                name: names[i],
            },
        });
    }

    // Seed page visits
    const pages = ["/", "/customize/female-2000", "/customize/male-3000"];
    for (let i = 0; i < 50; i++) {
        await prisma.pageVisit.create({
            data: {
                storeId,
                page: pages[i % 3],
                sessionId: `session-${i}`,
            },
        });
    }

    // Seed products
    const products = [
        { name: "Premium Gift Basket", price: 2500, stock: 15 },
        { name: "Chocolate Collection", price: 800, stock: 30 },
        { name: "Flower Bouquet", price: 1200, stock: 8 },
        { name: "Luxury Hamper", price: 4500, stock: 5 },
    ];

    for (const product of products) {
        await prisma.product.create({
            data: { storeId, ...product },
        });
    }

    console.log("✓ Seed complete!");
}

main().catch(console.error);