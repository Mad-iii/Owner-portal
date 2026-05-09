import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";

async function main() {
    const { prisma } = await import("../src/lib/prisma");
    const hashedPassword = await bcrypt.hash("dhanak2026", 12);

    const store = await prisma.store.upsert({
        where: { slug: "dhanak" },
        update: {},
        create: {
            name: "Dhanak Accessories",
            slug: "dhanak",
            email: process.env.DHANAK_EMAIL,
            password: process.env.DHANAK_PASSWORD,
        },
    });

    console.log("✓ Dhanak store created!");
    console.log("Store ID:", store.id);
    console.log("Login email:", store.email);
    console.log("Login password: dhanak2026");
    console.log(`\nAdd to Dhanak's .env:`);
    console.log(`STORE_ID="${store.id}"`);
    console.log(`VITE_STORE_ID="${store.id}"`);
}

main()
    .catch(console.error)
    .finally(async () => {
        const { prisma } = await import("../src/lib/prisma");
        await prisma.$disconnect();
    });