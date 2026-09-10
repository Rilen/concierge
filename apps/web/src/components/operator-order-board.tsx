"use client";

import React, { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/actions/order.actions";
import { OrderStatus } from "@/domain/orders/calculations";
import {
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  notes?: string | null;
  options: Array<{
    id: string;
    groupName: string;
    optionName: string;
    price: string;
  }>;
}

interface OrderData {
  id: string;
  publicId: string;
  orderNumber: number;
  type: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryComplement?: string | null;
  deliveryReference?: string | null;
  subtotal: string;
  deliveryFee: string;
  total: string;
  paymentMethod: string;
  changeFor?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  items: OrderItem[];
}

export function OperatorOrderBoard({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: OrderData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateOrderStatusAction(restaurantId, {
        orderId,
        nextStatus,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Falha ao alterar status");
      } else {
        router.refresh();
      }
    });
  };

  const activeOrders = initialOrders.filter(
    (o) => !["DELIVERED", "PICKED_UP", "CANCELLED"].includes(o.status)
  );

  const completedOrders = initialOrders.filter((o) =>
    ["DELIVERED", "PICKED_UP", "CANCELLED"].includes(o.status)
  );

  const displayedOrders = activeTab === "ACTIVE" ? activeOrders : completedOrders;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Painel Operacional de Pedidos
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerenciamento e fluxo de pedidos em tempo real para a cozinha e balcão.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ACTIVE"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          Em Aberto ({activeOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "COMPLETED"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-600 hover:bg-neutral-100"
          }`}
        >
          Finalizados / Histórico ({completedOrders.length})
        </button>
      </div>

      {/* Orders Grid */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-100 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-neutral-800">
            Nenhum pedido {activeTab === "ACTIVE" ? "em aberto" : "no histórico"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Novos pedidos de clientes aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedOrders.map((order) => {
            const isDelivery = order.type === "DELIVERY";

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Order header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-neutral-900">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isDelivery
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isDelivery ? "Entrega" : "Retirada"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 mt-0.5">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {order.customerPhone}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-neutral-900 block">
                        R$ {Number(order.total).toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-[10px] text-neutral-500 uppercase">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Address summary */}
                  {isDelivery && (
                    <div className="mb-3 p-2.5 rounded-xl bg-neutral-50 text-xs text-neutral-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-neutral-800">
                          {order.deliveryStreet}, {order.deliveryNumber}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {order.deliveryNeighborhood}
                          {order.deliveryComplement ? ` • ${order.deliveryComplement}` : ""}
                        </p>
                        {order.deliveryReference && (
                          <p className="text-[10px] text-neutral-400 italic">
                            Ref: {order.deliveryReference}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2 py-3 border-y border-neutral-100 text-xs">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex justify-between font-bold text-neutral-900">
                          <span>
                            {item.quantity}x {item.productName}
                          </span>
                          <span>R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}</span>
                        </div>
                        {item.options.length > 0 && (
                          <ul className="pl-3 text-[11px] text-neutral-500 list-disc">
                            {item.options.map((opt) => (
                              <li key={opt.id}>
                                {opt.groupName}: {opt.optionName}
                              </li>
                            ))}
                          </ul>
                        )}
                        {item.notes && (
                          <p className="text-[11px] italic text-amber-700 bg-amber-50/50 p-1 rounded-sm mt-0.5">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-2 text-xs text-neutral-600 bg-neutral-50 p-2 rounded-lg">
                      <strong>Nota geral:</strong> {order.notes}
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="text-[11px] text-neutral-400 mb-2 flex items-center justify-between">
                    <span>Status atual: <strong>{order.status}</strong></span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === "RECEIVED" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "CONFIRMED")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Aceitar Pedido
                      </button>
                    )}

                    {order.status === "CONFIRMED" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "PREPARING")}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Iniciar Preparo
                      </button>
                    )}

                    {order.status === "PREPARING" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "READY")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Marcar como Pronto
                      </button>
                    )}

                    {order.status === "READY" && isDelivery && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Saiu para Entrega
                      </button>
                    )}

                    {order.status === "OUT_FOR_DELIVERY" && isDelivery && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "DELIVERED")}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Confirmar Entregue
                      </button>
                    )}

                    {order.status === "READY" && !isDelivery && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "PICKED_UP")}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Entregue ao Cliente
                      </button>
                    )}

                    {!["DELIVERED", "PICKED_UP", "CANCELLED"].includes(order.status) && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(order.id, "CANCELLED")}
                        className="px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
