"use client";

import Link from "next/link";
import { use } from "react";
import { useCart } from "@/context/cart-context";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { items, updateQuantity, removeItem, clearCart, subtotal, totalQuantity } = useCart();

  if (totalQuantity === 0) {
    return (
      <main className="max-w-xl mx-auto px-4 pt-12 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Sua sacola está vazia</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Adicione itens deliciosos do cardápio para fazer seu pedido.
        </p>
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center justify-center mt-6 px-6 py-3 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition-colors"
        >
          Ver Cardápio
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 pt-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Cardápio
        </Link>
        <h1 className="text-base font-bold text-neutral-900">Sua Sacola ({totalQuantity})</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
        >
          Limpar
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.tempId}
            className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{item.productName}</h3>
                {item.selectedOptions.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                    {item.selectedOptions.map((opt) => (
                      <li key={opt.optionId}>
                        • {opt.groupName}: <span className="text-neutral-700">{opt.optionName}</span>
                        {opt.price > 0 && ` (+R$ ${opt.price.toFixed(2).replace(".", ",")})`}
                      </li>
                    ))}
                  </ul>
                )}
                {item.notes && (
                  <p className="mt-1 text-xs italic text-neutral-400">
                    Obs: {item.notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.tempId)}
                className="text-neutral-400 hover:text-rose-600 p-1 transition-colors"
                aria-label="Remover item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-50">
              <div className="flex items-center border border-neutral-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.tempId, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center text-xs font-bold text-neutral-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.tempId, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-sm font-bold text-neutral-900">
                R$ {item.subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-6 space-y-2 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal dos itens</span>
          <span className="font-semibold text-neutral-900">
            R$ {subtotal.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Taxa de entrega</span>
          <span>Calculada na próxima etapa</span>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-neutral-400 block">Subtotal</span>
            <span className="text-base font-bold text-neutral-900">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </span>
          </div>

          <Link
            href={`/r/${slug}/checkout`}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-5 rounded-xl shadow-md transition-all text-center text-sm"
          >
            Escolher Entrega ou Retirada
          </Link>
        </div>
      </div>
    </main>
  );
}
