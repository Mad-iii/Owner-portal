"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import {
    LayoutDashboard, ShoppingCart, Package,
    Users, BarChart2, LogOut, Sun, Moon, Store,
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
    const { theme, toggle } = useTheme();

    return (
        <aside style={{
            width: "240px",
            minWidth: "240px",
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            position: "sticky",
            top: 0,
        }}>
            {/* Logo */}
            <div style={{
                padding: "24px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
            }}>
                <div style={{
                    width: "32px",
                    height: "32px",
                    background: "var(--blue)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <Store size={16} color="white" />
                </div>
                <div>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>Portal</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{storeName}</p>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                fontSize: "13.5px",
                                fontWeight: active ? 600 : 400,
                                color: active ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                                background: active ? "var(--sidebar-active-bg)" : "transparent",
                                textDecoration: "none",
                                transition: "all 0.15s",
                            }}
                        >
                            <Icon size={15} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "2px" }}>
                <button
                    onClick={toggle}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        color: "var(--sidebar-text)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        borderRadius: "8px",
                        fontSize: "13.5px",
                        color: "var(--sidebar-text)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                    }}
                >
                    <LogOut size={15} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}