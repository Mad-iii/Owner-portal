import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar storeName={session.user.name ?? "Your Store"} />
            <main className="flex-1 overflow-auto p-8">{children}</main>
        </div>
    );
}