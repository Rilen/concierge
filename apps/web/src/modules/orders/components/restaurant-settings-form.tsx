"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurantAction } from "@/actions/restaurant.actions";
import { Check, AlertCircle, Loader2 } from "lucide-react";

interface RestaurantSettingsProps {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  openingHours: string;
  status: "OPEN" | "CLOSED" | "PAUSED";
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  fixedDeliveryFee: string;
  minOrderAmount: string;
}

export function RestaurantSettingsForm({
  restaurant,
}: {
  restaurant: RestaurantSettingsProps;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(restaurant.name);
  const [phone, setPhone] = useState(restaurant.phone);
  const [address, setAddress] = useState(restaurant.address);
  const [openingHours, setOpeningHours] = useState(restaurant.openingHours);
  const [status, setStatus] = useState<"OPEN" | "CLOSED" | "PAUSED">(restaurant.status);
  const [estimatedTimeMin, setEstimatedTimeMin] = useState(restaurant.estimatedTimeMin);
  const [estimatedTimeMax, setEstimatedTimeMax] = useState(restaurant.estimatedTimeMax);
  const [deliveryEnabled, setDeliveryEnabled] = useState(restaurant.deliveryEnabled);
  const [pickupEnabled, setPickupEnabled] = useState(restaurant.pickupEnabled);
  const [fixedDeliveryFee, setFixedDeliveryFee] = useState(restaurant.fixedDeliveryFee);
  const [minOrderAmount, setMinOrderAmount] = useState(restaurant.minOrderAmount);

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateRestaurantAction(restaurant.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        openingHours: openingHours.trim(),
        status,
        estimatedTimeMin: Number(estimatedTimeMin),
        estimatedTimeMax: Number(estimatedTimeMax),
        deliveryEnabled,
        pickupEnabled,
        fixedDeliveryFee: Number(fixedDeliveryFee.replace(",", ".")),
        minOrderAmount: Number(minOrderAmount.replace(",", ".")),
      });

      if (!res.success) {
        setFeedback({ success: false, message: res.error || "Erro ao atualizar" });
      } else {
        setFeedback({ success: true, message: "Configurações atualizadas com sucesso!" });
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.success ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Operacional / Status */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Status Operacional</h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Status do Restaurante
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["OPEN", "CLOSED", "PAUSED"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  status === s
                    ? s === "OPEN"
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                      : s === "CLOSED"
                      ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                      : "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}
              >
                {s === "OPEN" ? "Aberto" : s === "CLOSED" ? "Fechado" : "Pausado"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Horário de Funcionamento
          </label>
          <input
            type="text"
            value={openingHours}
            onChange={(e) => setOpeningHours(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Dados do Estabelecimento */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Informações Básicas</h2>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Nome do Estabelecimento *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Telefone / WhatsApp *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Slug do Link
            </label>
            <input
              type="text"
              disabled
              value={restaurant.slug}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            Endereço Completo *
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* Entrega e Retirada */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Entrega e Retirada</h2>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
              className="rounded-md border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Habilitar Entrega</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={pickupEnabled}
              onChange={(e) => setPickupEnabled(e.target.checked)}
              className="rounded-md border-neutral-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Habilitar Retirada</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Taxa de Entrega Fixa (R$)
            </label>
            <input
              type="text"
              value={fixedDeliveryFee}
              onChange={(e) => setFixedDeliveryFee(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Pedido Mínimo (R$)
            </label>
            <input
              type="text"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tempo Estimado Mínimo (min)
            </label>
            <input
              type="number"
              value={estimatedTimeMin}
              onChange={(e) => setEstimatedTimeMin(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Tempo Estimado Máximo (min)
            </label>
            <input
              type="number"
              value={estimatedTimeMax}
              onChange={(e) => setEstimatedTimeMax(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Salvando alterações...</span>
          </>
        ) : (
          <span>Salvar Configurações</span>
        )}
      </button>
    </form>
  );
}
