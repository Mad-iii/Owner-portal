import { config } from "dotenv";
config({ path: ".env.local" });

const STORE_ID = "cmopphg0z00008cilb19l1ddw";

const products = [
    { id: "dhanak-1", name: "Phool Jhumka", price: 4500, category: "Earrings", img: "/Img/JHUMKA1.png", stock: 10 },
    { id: "dhanak-2", name: "Zari Choker", price: 12900, category: "Necklaces", img: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800", stock: 5 },
    { id: "dhanak-3", name: "Tikka Gota", price: 2200, category: "Accessories", img: "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=800", stock: 15 },
    { id: "dhanak-4", name: "Meena Bangle", price: 3800, category: "Bangles", img: "/Img/BANGLE1.png", stock: 20 },
    { id: "dhanak-5", name: "Chand Bali", price: 5200, category: "Earrings", img: "https://images.unsplash.com/photo-1630019642935-0193a07d042c?w=800", stock: 8 },
    { id: "dhanak-6", name: "Mala Necklace", price: 8500, category: "Necklaces", img: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800", stock: 6 },
    { id: "dhanak-7", name: "Rani Haar", price: 15000, category: "Necklaces", img: "https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?w=800", stock: 3 },
];

async function main() {
    const { prisma } = await import("../src/lib/prisma");

    for (const p of products) {
        await prisma.product.upsert({
            where: { id: p.id },
            update: { name: p.name, price: p.price, category: p.category, stock: p.stock },
            create: {
                id: p.id,
                storeId: STORE_ID,
                name: p.name,
                price: p.price,
                category: p.category,
                stock: p.stock,
                active: true,
            },
        });
        console.log(`✓ ${p.name}`);
    }

    console.log("Done!");
}

main().catch(console.error);