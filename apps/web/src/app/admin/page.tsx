import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Building2,
  ShoppingBag,
  Users,
  Percent,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administração Geral | PALADAR",
};

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?callbackUrl=/admin");
  }

  if (user.role !== "MASTER") {
    redirect("/gestao");
  }

  const allRestaurants = await db.query.restaurants.findMany({
    orderBy: [desc(schema.restaurants.createdAt)],
  });

  const allOrders = await db.query.orders.findMany({
    columns: { total: true, platformFee: true },
  });

  const allUsers = await db.query.users.findMany();

  const totalVolume = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalPlatformFees = allOrders.reduce((sum, o) => sum + Number(o.platformFee), 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> MASTER PLATAFORMA
            </span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">
            Painel Geral do PALADAR
          </h1>
          <p className="text-xs text-neutral-500">
            Visão unificada da infraestrutura, restaurantes e transações da plataforma.
          </p>
        </div>

        <Link
          href="/admin/restaurantes"
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Restaurante
        </Link>
      </div>

      {/* Platform Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span>Restaurantes</span>
          </div>
          <span className="text-2xl font-black text-neutral-900">{allRestaurants.length}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
            <span>Volume Transacionado</span>
          </div>
          <span className="text-2xl font-black text-neutral-900">
            R$ {totalVolume.toFixed(2).replace(".", ",")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Users className="w-4 h-4 text-amber-500" />
            <span>Usuários Totais</span>
          </div>
          <span className="text-2xl font-black text-neutral-900">{allUsers.length}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center gap-2 text-neutral-500 text-xs mb-1">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>Comissão Paladar (0,5%)</span>
          </div>
          <span className="text-2xl font-black text-emerald-700">
            R$ {totalPlatformFees.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Quick Access to Master Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link
          href="/admin/restaurantes"
          className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Gerenciar Restaurantes</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Criar novos estabelecimentos, definir slugs e taxas
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>

        <Link
          href="/admin/usuarios"
          className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors flex items-center justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Gerenciar Usuários</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Criar gerentes, operadores e vincular estabelecimentos
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>
      </div>

      {/* Restaurants List */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
          Restaurantes Cadastrados
        </h2>

        <div className="divide-y divide-neutral-100">
          {allRestaurants.map((rest) => (
            <div
              key={rest.id}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold text-neutral-900">{rest.name}</h4>
                <p className="text-xs text-neutral-500">
                  Slug:{" "}
                  <Link
                    href={`/r/${rest.slug}`}
                    target="_blank"
                    className="text-emerald-600 font-medium hover:underline"
                  >
                    /r/{rest.slug}
                  </Link>{" "}
                  • Tel: {rest.phone}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rest.status === "OPEN"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {rest.status === "OPEN" ? "Aberto" : "Fechado"}
                </span>
                <Link
                  href={`/r/${rest.slug}`}
                  target="_blank"
                  className="text-xs font-semibold text-neutral-700 hover:text-neutral-900"
                >
                  Ver Cardápio
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
