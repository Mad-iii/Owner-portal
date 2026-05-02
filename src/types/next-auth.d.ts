import "next-auth";

declare module "next-auth" {
    interface User {
        storeId: string;
        storeSlug: string;
    }

    interface Session {
        user: {
            storeId: string;
            storeSlug: string;
            name?: string | null;
            email?: string | null;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        storeId: string;
        storeSlug: string;
    }
}