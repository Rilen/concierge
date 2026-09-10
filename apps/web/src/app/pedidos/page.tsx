import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { listRestaurantOrders } from "@/services/order.service";
import { OperatorOrderBoard } from "@/components/operator-order-board";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Painel Operacional de Pedidos | PALADAR",
};

export default async function PedidosPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?callbackUrl=/pedidos");
  }

  // Find user's assigned restaurant
  let restaurantId: string | null = null;

  if (user.role === "MASTER") {
    // If master, pick first available restaurant
    const firstRestaurant = await db.query.restaurants.findFirst();
    restaurantId = firstRestaurant?.id || null;
  } else {
    const association = await db.query.restaurantUsers.findFirst({
      where: eq(schema.restaurantUsers.userId, user.id),
    });
    restaurantId = association?.restaurantId || null;
  }

  if (!restaurantId) {
    return (
      <main className="max-w-md mx-auto p-6 text-center pt-16">
        <h1 className="text-xl font-bold text-neutral-900">Nenhum restaurante vinculado</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Seu usuário não possui permissão associada a um restaurante ativo.
        </p>
      </main>
    );
  }

  const orders = await listRestaurantOrders(restaurantId);

  return (
    <div className="min-h-screen bg-neutral-100">
      <OperatorOrderBoard restaurantId={restaurantId} initialOrders={orders} />
    </div>
  );
}
