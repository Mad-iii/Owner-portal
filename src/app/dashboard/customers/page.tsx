import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomersPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const customers = await prisma.customer.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Customers</h1>
            <div className="bg-white rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="text-left px-6 py-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer: any) => (
                            <tr key={customer.id} className="border-b border-gray-50 hover:bg-blue-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                            {(customer.name ?? customer.email)[0].toUpperCase()}
                                        </div>
                                        {customer.name ?? "—"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{customer.email}</td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(customer.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {customers.length === 0 && (
                    <div className="text-center py-12 text-gray-400">No customers yet.</div>
                )}
            </div>
        </div>
    );
}