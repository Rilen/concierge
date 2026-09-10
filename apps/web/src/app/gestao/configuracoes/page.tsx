import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { RestaurantSettingsForm } from "@/components/restaurant-settings-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configurações Operacionais | PALADAR",
};

export default async function GestaoConfiguracoesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?callbackUrl=/gestao/configuracoes");
  }

  let restaurant = null;

  if (user.role === "MASTER") {
    restaurant = await db.query.restaurants.findFirst();
  } else {
    const assoc = await db.query.restaurantUsers.findFirst({
      where: eq(schema.restaurantUsers.userId, user.id),
      with: { restaurant: true },
    });
    restaurant = assoc?.restaurant || null;
  }

  if (!restaurant) {
    return (
      <main className="max-w-md mx-auto p-6 text-center pt-16">
        <h1 className="text-xl font-bold text-neutral-900">Nenhum restaurante ativo</h1>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/gestao"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel
        </Link>
        <h1 className="text-base font-bold text-neutral-900">Configurações Operacionais</h1>
      </div>

      <RestaurantSettingsForm
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          phone: restaurant.phone,
          address: restaurant.address,
          openingHours: restaurant.openingHours,
          status: restaurant.status as "OPEN" | "CLOSED" | "PAUSED",
          estimatedTimeMin: restaurant.estimatedTimeMin,
          estimatedTimeMax: restaurant.estimatedTimeMax,
          deliveryEnabled: restaurant.deliveryEnabled,
          pickupEnabled: restaurant.pickupEnabled,
          fixedDeliveryFee: restaurant.fixedDeliveryFee,
          minOrderAmount: restaurant.minOrderAmount,
        }}
      />
    </main>
  );
}
