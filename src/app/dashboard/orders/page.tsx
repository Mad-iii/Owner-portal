import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OrdersClient from "@/components/OrdersClient";

export default async function OrdersPage() {
    const session = await auth();
    if (!session?.user?.storeId) redirect("/login");
    const storeId = session.user.storeId;

    const orders = await prisma.order.findMany({
        where: { storeId },
        orderBy: { createdAt: "desc" },
        include: { items: true },
    });

    return <OrdersClient orders={JSON.parse(JSON.stringify(orders))} />;
}