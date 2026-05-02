"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard, ShoppingCart, Package,
    Users, BarChart2, LogOut,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
];

export default function Sidebar({ storeName }: { storeName: string }) {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r flex flex-col">
            <div className="p-6 border-b">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Portal</p>
                <h2 className="font-semibold text-gray-900">{storeName}</h2>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                ? "bg-gray-100 text-gray-900 font-medium"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            <Icon size={16} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 w-full"
                >
                    <LogOut size={16} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}