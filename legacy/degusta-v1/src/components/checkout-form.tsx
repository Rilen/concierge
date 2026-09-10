"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { createOrderAction } from "@/actions/order.actions";
import { calculateChange } from "@/domain/orders/calculations";
import { ArrowLeft, Bike, Store, DollarSign, QrCode, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface RestaurantCheckoutProps {
  slug: string;
  name: string;
  status: string;
  fixedDeliveryFee: string;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  paymentSettings?: {
    acceptsPix: boolean;
    acceptsCredit: boolean;
    acceptsDebit: boolean;
    acceptsCash: boolean;
    pixKey?: string | null;
  } | null;
}

function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function CheckoutForm({ restaurant }: { restaurant: RestaurantCheckoutProps }) {
  const router = useRouter();
  const { items, subtotal, totalQuantity, clearCart } = useCart();

  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">(
    restaurant.deliveryEnabled ? "DELIVERY" : "PICKUP"
  );

  // Customer contact info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Delivery address info
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryComplement, setDeliveryComplement] = useState("");
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH">("PIX");
  const [cashGiven, setCashGiven] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState("");

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const deliveryFee = orderType === "DELIVERY" ? Number(restaurant.fixedDeliveryFee) : 0;
  const grandTotal = Math.round((subtotal + deliveryFee) * 100) / 100;

  // Change calculation
  const changeResult =
    paymentMethod === "CASH" && cashGiven
      ? calculateChange(grandTotal, Number(cashGiven.replace(",", ".")))
      : null;

  if (totalQuantity === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500 text-sm">Seu carrinho está vazio.</p>
        <Link
          href={`/r/${restaurant.slug}`}
          className="inline-block mt-4 text-xs font-semibold text-emerald-600 hover:underline"
        >
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic frontend validations
    if (!customerName.trim() || customerName.trim().length < 2) {
      setFormError("Por favor, informe seu nome.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setFormError("Por favor, informe um telefone válido.");
      return;
    }

    if (orderType === "DELIVERY") {
      if (!deliveryStreet.trim()) {
        setFormError("Por favor, informe a rua para entrega.");
        return;
      }
      if (!deliveryNumber.trim()) {
        setFormError("Por favor, informe o número do endereço.");
        return;
      }
      if (!deliveryNeighborhood.trim()) {
        setFormError("Por favor, informe o bairro para entrega.");
        return;
      }
    }

    if (paymentMethod === "CASH" && cashGiven) {
      if (changeResult && !changeResult.isValid) {
        setFormError(changeResult.error || "Valor para troco inválido.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        restaurantSlug: restaurant.slug,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        type: orderType,
        deliveryStreet: orderType === "DELIVERY" ? deliveryStreet.trim() : null,
        deliveryNumber: orderType === "DELIVERY" ? deliveryNumber.trim() : null,
        deliveryComplement: orderType === "DELIVERY" ? deliveryComplement.trim() || null : null,
        deliveryNeighborhood: orderType === "DELIVERY" ? deliveryNeighborhood.trim() : null,
        deliveryPostalCode: orderType === "DELIVERY" ? deliveryPostalCode.trim() || null : null,
        deliveryReference: orderType === "DELIVERY" ? deliveryReference.trim() || null : null,
        paymentMethod,
        changeFor:
          paymentMethod === "CASH" && cashGiven
            ? Number(cashGiven.replace(",", "."))
            : null,
        notes: orderNotes.trim() || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes || null,
          selectedOptionIds: i.selectedOptions.map((o) => o.optionId),
        })),
      };

      const result = await createOrderAction(payload);

      if (!result.success || !result.publicId) {
        setFormError(result.error || "Não foi possível concluir o pedido.");
        setIsSubmitting(false);
        return;
      }

      // Clear local cart and redirect to live tracking page
      clearCart();
      router.push(`/pedido/${result.publicId}`);
    } catch (err) {
      setFormError((err as Error).message || "Erro inesperado.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="max-w-xl mx-auto px-4 pt-4 pb-36">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href={`/r/${restaurant.slug}/carrinho`}
          className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <h1 className="text-base font-bold text-neutral-900">Finalizar Pedido</h1>
      </div>

      {formError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* 1. Modo de Recebimento */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5">
        <h2 className="text-sm font-bold text-neutral-900 mb-3">
          Como você deseja receber?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOrderType("DELIVERY")}
            disabled={!restaurant.deliveryEnabled}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              orderType === "DELIVERY"
                ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold"
                : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
            } disabled:opacity-40`}
          >
            <Bike className="w-5 h-5 mx-auto mb-1.5" />
            <div className="text-xs">Entrega</div>
            <div className="text-[10px] text-neutral-500 font-normal">
              R$ {Number(restaurant.fixedDeliveryFee).toFixed(2).replace(".", ",")}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setOrderType("PICKUP")}
            disabled={!restaurant.pickupEnabled}
            className={`p-3.5 rounded-xl border text-center transition-all ${
              orderType === "PICKUP"
                ? "border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold"
                : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
            } disabled:opacity-40`}
          >
            <Store className="w-5 h-5 mx-auto mb-1.5" />
            <div className="text-xs">Retirar no Local</div>
            <div className="text-[10px] text-neutral-500 font-normal">
              {restaurant.estimatedTimeMin}–{restaurant.estimatedTimeMax} min
            </div>
          </button>
        </div>
      </section>

      {/* 2. Dados do Cliente */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5 space-y-3">
        <h2 className="text-sm font-bold text-neutral-900">Seus Dados</h2>

        <div>
          <label htmlFor="customerName" className="block text-xs font-semibold text-neutral-700 mb-1">
            Seu Nome *
          </label>
          <input
            id="customerName"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: Ana Silva"
            className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-xs font-semibold text-neutral-700 mb-1">
            Telefone / WhatsApp *
          </label>
          <input
            id="customerPhone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
            placeholder="(11) 98765-4321"
            className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </section>

      {/* 3. Endereço de Entrega (se entrega) */}
      {orderType === "DELIVERY" && (
        <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5 space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">Endereço de Entrega</h2>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label htmlFor="deliveryStreet" className="block text-xs font-semibold text-neutral-700 mb-1">
                Rua / Avenida *
              </label>
              <input
                id="deliveryStreet"
                type="text"
                required
                value={deliveryStreet}
                onChange={(e) => setDeliveryStreet(e.target.value)}
                placeholder="Nome da rua"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="deliveryNumber" className="block text-xs font-semibold text-neutral-700 mb-1">
                Número *
              </label>
              <input
                id="deliveryNumber"
                type="text"
                required
                value={deliveryNumber}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                placeholder="123"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="deliveryNeighborhood" className="block text-xs font-semibold text-neutral-700 mb-1">
                Bairro *
              </label>
              <input
                id="deliveryNeighborhood"
                type="text"
                required
                value={deliveryNeighborhood}
                onChange={(e) => setDeliveryNeighborhood(e.target.value)}
                placeholder="Bairro"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="deliveryComplement" className="block text-xs font-semibold text-neutral-700 mb-1">
                Complemento
              </label>
              <input
                id="deliveryComplement"
                type="text"
                value={deliveryComplement}
                onChange={(e) => setDeliveryComplement(e.target.value)}
                placeholder="Apto 42, Bloco B"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="deliveryPostalCode" className="block text-xs font-semibold text-neutral-700 mb-1">
                CEP (opcional)
              </label>
              <input
                id="deliveryPostalCode"
                type="text"
                value={deliveryPostalCode}
                onChange={(e) => setDeliveryPostalCode(formatCep(e.target.value))}
                placeholder="00000-000"
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="deliveryReference" className="block text-xs font-semibold text-neutral-700 mb-1">
                Ponto de Referência
              </label>
              <input
                id="deliveryReference"
                type="text"
                value={deliveryReference}
                onChange={(e) => setDeliveryReference(e.target.value)}
                placeholder="Próximo à padaria..."
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>
      )}

      {/* 4. Forma de Pagamento */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5">
        <h2 className="text-sm font-bold text-neutral-900 mb-3">Forma de Pagamento</h2>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("PIX")}
            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all ${
              paymentMethod === "PIX"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>PIX</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("CREDIT_CARD")}
            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all ${
              paymentMethod === "CREDIT_CARD"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <CreditCard className="w-4 h-4 text-neutral-600" />
            <span>Cartão de Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("DEBIT_CARD")}
            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all ${
              paymentMethod === "DEBIT_CARD"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <CreditCard className="w-4 h-4 text-neutral-600" />
            <span>Cartão de Débito</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`p-3 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all ${
              paymentMethod === "CASH"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold"
                : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span>Dinheiro</span>
          </button>
        </div>

        {/* Campo de troco para dinheiro */}
        {paymentMethod === "CASH" && (
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
            <label htmlFor="cashGiven" className="block text-xs font-semibold text-neutral-800">
              Precisa de troco? Para quanto?
            </label>
            <input
              id="cashGiven"
              type="text"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder={`Ex: ${(grandTotal + 10).toFixed(2).replace(".", ",")}`}
              className="w-full text-xs p-2.5 rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {changeResult && changeResult.isValid && changeResult.change > 0 && (
              <p className="text-xs text-emerald-700 font-medium">
                Troco a levar: <strong>R$ {changeResult.change.toFixed(2).replace(".", ",")}</strong>
              </p>
            )}
            {changeResult && !changeResult.isValid && (
              <p className="text-xs text-rose-600">{changeResult.error}</p>
            )}
          </div>
        )}
      </section>

      {/* 5. Observações do Pedido */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-5">
        <label htmlFor="orderNotes" className="block text-xs font-semibold text-neutral-700 mb-1">
          Observações adicionais para o restaurante
        </label>
        <textarea
          id="orderNotes"
          rows={2}
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="Ex: Tocar a campainha, deixar na portaria..."
          className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </section>

      {/* Resumo Financeiro */}
      <section className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-6 space-y-2 text-xs">
        <h3 className="font-bold text-neutral-900 text-sm mb-2">Resumo Financeiro</h3>
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal ({totalQuantity} itens)</span>
          <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-neutral-600">
          <span>Taxa de Entrega</span>
          <span>{deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace(".", ",")}` : "Grátis"}</span>
        </div>
        <div className="flex justify-between text-neutral-900 font-bold text-sm pt-2 border-t border-neutral-100">
          <span>Total</span>
          <span>R$ {grandTotal.toFixed(2).replace(".", ",")}</span>
        </div>
      </section>

      {/* Fixed Bottom Confirmation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Total</span>
            <span className="text-base font-bold text-neutral-900">
              R$ {grandTotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando pedido...</span>
              </>
            ) : (
              <span>Confirmar Pedido</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
