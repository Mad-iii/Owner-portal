import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";

async function main() {
    const { prisma } = await import("../src/lib/prisma");

    const email = process.env.SEED_STORE_EMAIL;
    const password = process.env.SEED_STORE_PASSWORD;
    const name = process.env.SEED_STORE_NAME || "BoxIt Gift Store";
    const slug = process.env.SEED_STORE_SLUG || "boxit";

    if (!email || !password) {
        throw new Error("Missing SEED_STORE_EMAIL or SEED_STORE_PASSWORD in .env.local");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const store = await prisma.store.upsert({
        where: { slug },
        update: { name, email, password: hashedPassword },
        create: { name, slug, email, password: hashedPassword },
    });

    console.log("✓ Store created/updated successfully!");
    console.log("Store ID:", store.id);
    console.log("Login email:", store.email);
    // ❌ Never log the password
    console.log("\nAdd this to the store's .env:");
    console.log(`STORE_ID="${store.id}"`);
    console.log(`VITE_STORE_ID="${store.id}"`);
}

main()
    .catch(console.error)
    .finally(async () => {
        const { prisma } = await import("../src/lib/prisma");
        await prisma.$disconnect();
    });