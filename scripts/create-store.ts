import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";

async function main() {
    const { prisma } = await import("../src/lib/prisma");
    const hashedPassword = await bcrypt.hash("boxit2026", 12);

    const store = await prisma.store.upsert({
        where: { slug: "boxit" },
        update: {
            name: "BoxIt Gift Store",
            email: "mahdsadiq180@gmail.com",
            password: hashedPassword,
        },
        create: {
            name: "BoxIt Gift Store",
            slug: "boxit",
            email: "mahdsadiq180@gmail.com",
            password: hashedPassword,
        },
    });

    console.log("✓ Store created/updated successfully!");
    console.log("Store ID:", store.id);
    console.log("Login email:", store.email);
    console.log("Login password: boxit2026");
    console.log("\nAdd this to BoxIt's .env:");
    console.log(`STORE_ID="${store.id}"`);
    console.log(`VITE_STORE_ID="${store.id}"`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());