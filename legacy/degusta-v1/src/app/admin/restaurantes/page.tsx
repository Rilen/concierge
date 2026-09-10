import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import { MasterRestaurantManager } from "@/components/master-restaurant-manager";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gerenciar Restaurantes | PALADAR",
};

export default async function AdminRestaurantesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "MASTER") {
    redirect("/admin/login?callbackUrl=/admin/restaurantes");
  }

  const restaurants = await db.query.restaurants.findMany({
    orderBy: [desc(schema.restaurants.createdAt)],
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin"
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel Master
        </Link>
        <h1 className="text-base font-bold text-neutral-900">Restaurantes da Plataforma</h1>
      </div>

      <MasterRestaurantManager restaurants={restaurants} />
    </main>
  );
}
