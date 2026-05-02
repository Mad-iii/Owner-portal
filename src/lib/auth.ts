import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                // Find the store by owner email
                const store = await prisma.store.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!store) return null;

                // Check password
                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    store.password
                );

                if (!passwordMatch) return null;

                // Return store info — this goes into the session token
                return {
                    id: store.id,
                    email: store.email,
                    name: store.name,
                    storeId: store.id,
                    storeSlug: store.slug,
                };
            },
        }),
    ],
    callbacks: {
        // Put storeId into the JWT token
        async jwt({ token, user }) {
            if (user) {
                token.storeId = (user as any).storeId;
                token.storeSlug = (user as any).storeSlug;
            }
            return token;
        },
        // Put storeId into the session (accessible in components)
        async session({ session, token }) {
            if (token) {
                session.user.storeId = token.storeId as string;
                session.user.storeSlug = token.storeSlug as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",  // your custom login page
    },
});