"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRestaurantAction } from "@/actions/restaurant.actions";
import { Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

interface RestaurantItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  status: string;
  fixedDeliveryFee: string;
}

export function MasterRestaurantManager({
  restaurants,
}: {
  restaurants: RestaurantItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fixedFee, setFixedFee] = useState("7.00");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createRestaurantAction({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        phone: phone.trim(),
        address: address.trim(),
        fixedDeliveryFee: Number(fixedFee.replace(",", ".")),
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao criar restaurante");
      } else {
        setName("");
        setSlug("");
        setPhone("");
        setAddress("");
        setFixedFee("7.00");
        setShowModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Restaurante
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Novo Restaurante</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="Ex: Hamburgueria Central"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Slug do Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="hamburgueria-central"
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua das Flores, 123"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Taxa de Entrega Fixa Inicial (R$)
                </label>
                <input
                  type="text"
                  value={fixedFee}
                  onChange={(e) => setFixedFee(e.target.value)}
                  placeholder="7,00"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Restaurants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {restaurants.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-neutral-900">{r.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === "OPEN"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {r.status === "OPEN" ? "Aberto" : "Fechado"}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">{r.address}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Tel: {r.phone}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Taxa Entrega: R$ {Number(r.fixedDeliveryFee).toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <Link
                href={`/r/${r.slug}`}
                target="_blank"
                className="text-emerald-600 font-semibold hover:underline"
              >
                /r/{r.slug} ↗
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
