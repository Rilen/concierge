"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Store,
  MapPin,
  Phone,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface OrderTrackingData {
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
  estimatedMinutes?: number | null;
  createdAt: string | Date;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    address: string;
  };
  items: Array<{
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
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string | Date;
  }>;
}

const statusConfig: Record<
  string,
  { label: string; description: string; step: number; color: string }
> = {
  RECEIVED: {
    label: "🟡 Pedido recebido",
    description: "Seu pedido foi registrado e aguarda confirmação pelo restaurante.",
    step: 1,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  CONFIRMED: {
    label: "🔵 Pedido confirmado",
    description: "O restaurante aceitou seu pedido e já vai iniciar o preparo.",
    step: 2,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  PREPARING: {
    label: "👨‍🍳 Em preparo",
    description: "Nossa cozinha está preparando seu pedido com todo o carinho!",
    step: 3,
    color: "text-orange-600 bg-orange-50 border-orange-200",
  },
  READY: {
    label: "🟢 Pedido pronto",
    description: "O pedido está pronto!",
    step: 4,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  OUT_FOR_DELIVERY: {
    label: "🛵 Saiu para entrega",
    description: "O entregador está a caminho do seu endereço.",
    step: 5,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  DELIVERED: {
    label: "✅ Pedido entregue",
    description: "Pedido entregue com sucesso. Bom apetite!",
    step: 6,
    color: "text-emerald-700 bg-emerald-50 border-emerald-300",
  },
  PICKED_UP: {
    label: "✅ Pedido retirado",
    description: "Pedido retirado com sucesso. Bom apetite!",
    step: 6,
    color: "text-emerald-700 bg-emerald-50 border-emerald-300",
  },
  CANCELLED: {
    label: "❌ Pedido cancelado",
    description: "Este pedido foi cancelado.",
    step: 0,
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
};

const paymentLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  DEBIT_CARD: "Cartão de Débito",
  CASH: "Dinheiro",
};

export function OrderTracker({ initialOrder }: { initialOrder: OrderTrackingData }) {
  const [order, setOrder] = useState<OrderTrackingData>(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);

  // Poll for updates every 8 seconds if order is not finalized
  useEffect(() => {
    if (order.status === "DELIVERED" || order.status === "PICKED_UP" || order.status === "CANCELLED") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setIsUpdating(true);
        const res = await fetch(`/api/order/${order.publicId}`);
        if (res.ok) {
          const freshData = await res.json();
          if (freshData && freshData.order) {
            setOrder(freshData.order);
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar status do pedido:", err);
      } finally {
        setIsUpdating(false);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [order.publicId, order.status]);

  const currentInfo = statusConfig[order.status] || {
    label: order.status,
    description: "",
    step: 1,
    color: "text-neutral-700 bg-neutral-50 border-neutral-200",
  };

  const isDelivery = order.type === "DELIVERY";

  return (
    <main className="max-w-xl mx-auto px-4 pt-6 pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/r/${order.restaurant.slug}`}
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
        >
          {order.restaurant.name}
        </Link>
        <span className="text-xs font-mono text-neutral-400">
          Pedido #{order.orderNumber}
        </span>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-neutral-50 mb-3">
          {order.status === "RECEIVED" && <Clock className="w-8 h-8 text-amber-500" />}
          {order.status === "CONFIRMED" && <Clock className="w-8 h-8 text-blue-500" />}
          {order.status === "PREPARING" && <ChefHat className="w-8 h-8 text-orange-500" />}
          {order.status === "READY" && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          {order.status === "OUT_FOR_DELIVERY" && <Bike className="w-8 h-8 text-indigo-500" />}
          {(order.status === "DELIVERED" || order.status === "PICKED_UP") && (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          )}
          {order.status === "CANCELLED" && <AlertCircle className="w-8 h-8 text-rose-500" />}
        </div>

        <h1 className="text-xl font-bold text-neutral-900">{currentInfo.label}</h1>
        <p className="text-xs text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {currentInfo.description}
        </p>

        {order.estimatedMinutes && order.status !== "DELIVERED" && order.status !== "PICKED_UP" && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-600 font-medium">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Tempo estimado: ~{order.estimatedMinutes} minutos</span>
          </div>
        )}

        {isUpdating && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Verificando atualização...</span>
          </div>
        )}
      </div>

      {/* Items Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
          Itens do Pedido
        </h2>
        <div className="divide-y divide-neutral-50">
          {order.items.map((item) => (
            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <span className="font-semibold text-neutral-900">
                    {item.quantity}x {item.productName}
                  </span>
                  {item.options.length > 0 && (
                    <ul className="mt-0.5 space-y-0.5 text-[11px] text-neutral-500">
                      {item.options.map((opt) => (
                        <li key={opt.id}>
                          • {opt.groupName}: {opt.optionName}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.notes && (
                    <p className="text-[11px] text-neutral-400 italic mt-0.5">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-medium text-neutral-900 shrink-0 ml-2">
                  R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>R$ {Number(order.subtotal).toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Taxa de Entrega</span>
            <span>
              {Number(order.deliveryFee) > 0
                ? `R$ ${Number(order.deliveryFee).toFixed(2).replace(".", ",")}`
                : "Grátis"}
            </span>
          </div>
          <div className="flex justify-between text-neutral-900 font-bold text-sm pt-1 border-t border-neutral-50">
            <span>Total</span>
            <span>R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </div>

      {/* Delivery / Pickup Information */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5 space-y-3">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          {isDelivery ? "Entrega" : "Retirada no Local"}
        </h2>

        {isDelivery ? (
          <div className="flex items-start gap-2.5 text-xs text-neutral-700">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900">
                {order.deliveryStreet}, {order.deliveryNumber}
              </p>
              <p className="text-neutral-500">
                {order.deliveryNeighborhood}
                {order.deliveryComplement ? ` • ${order.deliveryComplement}` : ""}
              </p>
              {order.deliveryReference && (
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Ref: {order.deliveryReference}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 text-xs text-neutral-700">
            <Store className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-900">{order.restaurant.name}</p>
              <p className="text-neutral-500">{order.restaurant.address}</p>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                Apresente o número <strong>#{order.orderNumber}</strong> no balcão.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5 text-xs">
        <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
          Pagamento
        </h2>
        <div className="flex justify-between items-center text-neutral-700">
          <span>Método: <strong>{paymentLabels[order.paymentMethod] || order.paymentMethod}</strong></span>
          {order.changeFor && (
            <span className="text-neutral-500">
              Troco para R$ {Number(order.changeFor).toFixed(2).replace(".", ",")}
            </span>
          )}
        </div>
      </div>

      {/* Restaurant Contact */}
      <div className="text-center pt-2 text-xs text-neutral-400">
        <p>Dúvidas sobre o pedido? Fale com o restaurante:</p>
        <p className="font-semibold text-neutral-700 mt-0.5 flex items-center justify-center gap-1">
          <Phone className="w-3.5 h-3.5" />
          {order.restaurant.phone}
        </p>
      </div>
    </main>
  );
}
