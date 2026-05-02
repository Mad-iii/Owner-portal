import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProductsPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const products = await prisma.product.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Products</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product: any) => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                }`}>
                                {product.active ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {product.sku && <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>}
                        <div className="flex justify-between items-center">
                            <span className="text-blue-600 font-semibold">PKR {product.price.toLocaleString()}</span>
                            <span className={`text-sm font-medium ${product.stock < 10 ? "text-red-500" : "text-gray-500"}`}>
                                {product.stock} in stock
                            </span>
                        </div>
                    </div>
                ))}
                {products.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-gray-400">No products yet.</div>
                )}
            </div>
        </div>
    );
}