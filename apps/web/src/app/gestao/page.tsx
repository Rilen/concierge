import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFinancialSummary } from "@/services/financial.service";
import {
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  Bike,
  TrendingUp,
  Settings,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão do Restaurante | PALADAR",
};

export default async function GestaoDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login?callbackUrl=/gestao");
  }

  // Find linked restaurant
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
        <p className="text-sm text-neutral-500 mt-2">
          Você não possui nenhum estabelecimento associado no momento.
        </p>
      </main>
    );
  }

  const summary = await getFinancialSummary(restaurant.id);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Painel do Gerente
          </span>
          <h1 className="text-2xl font-black text-neutral-900 mt-2">{restaurant.name}</h1>
          <p className="text-xs text-neutral-500">
            Cardápio público:{" "}
            <Link
              href={`/r/${restaurant.slug}`}
              target="_blank"
              className="text-emerald-600 underline font-medium"
            >
              /r/{restaurant.slug}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pedidos"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Abrir Operação Cozinha
          </Link>
        </div>
      </div>

      {/* Main KPI Cards (Section 33) */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Hoje
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <span className="text-xs text-neutral-500 block">Pedidos Hoje</span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {summary.totalOrders}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <span className="text-xs text-neutral-500 block">Faturamento</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              R$ {summary.totalRevenue.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <span className="text-xs text-neutral-500 block">Ticket Médio</span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              R$ {summary.averageTicket.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Em preparo</span>
              <span className="text-xl font-bold text-neutral-900">
                {summary.inPreparation}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Em entrega</span>
              <span className="text-xl font-bold text-neutral-900">
                {summary.inDelivery}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-500 block">Taxa Paladar (0,5%)</span>
              <span className="text-sm font-bold text-neutral-700">
                R$ {summary.platformFeeTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Breakdown (Section 21) */}
      <section className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs mb-8">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
          Faturamento por Meio de Pagamento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl">
            <span className="text-neutral-500 block">PIX</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
              R$ {summary.paymentBreakdown.PIX.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl">
            <span className="text-neutral-500 block">Crédito</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
              R$ {summary.paymentBreakdown.CREDIT_CARD.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl">
            <span className="text-neutral-500 block">Débito</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
              R$ {summary.paymentBreakdown.DEBIT_CARD.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl">
            <span className="text-neutral-500 block">Dinheiro</span>
            <span className="text-sm font-bold text-neutral-900 mt-0.5 block">
              R$ {summary.paymentBreakdown.CASH.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
          Acesso Rápido
        </h2>

        <Link
          href="/pedidos"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Operação de Pedidos</h3>
              <p className="text-xs text-neutral-500">
                Visualizar novos pedidos, confirmar e mudar status
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>

        <Link
          href="/gestao/cardapio"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Gestão do Cardápio</h3>
              <p className="text-xs text-neutral-500">
                Categorias, produtos, complementos e preços
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>

        <Link
          href="/gestao/configuracoes"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Configurações Operacionais</h3>
              <p className="text-xs text-neutral-500">
                Taxa de entrega, horários, formas de pagamento
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </Link>
      </section>
    </main>
  );
}
