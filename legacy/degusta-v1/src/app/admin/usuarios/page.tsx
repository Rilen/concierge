import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guard";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import { ArrowLeft, Utensils } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gerenciar Usuários | PALADAR",
};

export default async function AdminUsuariosPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "MASTER") {
    redirect("/admin/login?callbackUrl=/admin/usuarios");
  }

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(schema.users.createdAt)],
  });

  const associations = await db.query.restaurantUsers.findMany({
    with: {
      restaurant: {
        columns: { name: true, slug: true },
      },
    },
  });

  const userAssocMap = new Map<string, Array<{ restaurantName: string; role: string }>>();
  for (const a of associations) {
    const list = userAssocMap.get(a.userId) || [];
    list.push({ restaurantName: a.restaurant.name, role: a.role });
    userAssocMap.set(a.userId, list);
  }

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
        <h1 className="text-base font-bold text-neutral-900">Usuários da Plataforma</h1>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs">
        <div className="divide-y divide-neutral-100">
          {allUsers.map((u) => {
            const userAssocs = userAssocMap.get(u.id) || [];

            return (
              <div
                key={u.id}
                className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{u.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.role === "MASTER"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : u.role === "GERENTE"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : u.role === "PEDIDOS"
                          ? "bg-orange-50 text-orange-700 border border-orange-200"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{u.email}</p>

                  {userAssocs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {userAssocs.map((assoc, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-700"
                        >
                          <Utensils className="w-3 h-3 text-neutral-400" />
                          {assoc.restaurantName} ({assoc.role})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-neutral-400 shrink-0">
                  ID: {u.id.substring(0, 14)}...
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
