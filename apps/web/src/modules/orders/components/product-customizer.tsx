"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, SelectedOption } from "@/context/cart-context";
import { ArrowLeft, Check, Minus, Plus } from "lucide-react";
import Link from "next/link";

interface OptionItem {
  id: string;
  name: string;
  price: string;
}

interface OptionGroupItem {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: OptionItem[];
}

interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  optionGroups: OptionGroupItem[];
}

export function ProductCustomizer({
  product,
  restaurantSlug,
}: {
  product: ProductDetails;
  restaurantSlug: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  // Record<groupId, OptionItem[]>
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, OptionItem[]>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const basePrice = Number(product.price);

  // Calculate options extra sum
  const optionsExtraTotal = Object.values(selectedByGroup)
    .flat()
    .reduce((sum, opt) => sum + Number(opt.price), 0);

  const unitTotal = basePrice + optionsExtraTotal;
  const totalPrice = Math.round(unitTotal * quantity * 100) / 100;

  const handleSelectOption = (group: OptionGroupItem, option: OptionItem) => {
    setValidationError(null);
    const currentList = selectedByGroup[group.id] || [];

    if (group.maxSelect === 1) {
      // Single choice
      setSelectedByGroup((prev) => ({
        ...prev,
        [group.id]: [option],
      }));
    } else {
      // Multiple choice
      const exists = currentList.some((o) => o.id === option.id);
      if (exists) {
        setSelectedByGroup((prev) => ({
          ...prev,
          [group.id]: currentList.filter((o) => o.id !== option.id),
        }));
      } else {
        if (currentList.length >= group.maxSelect) {
          setValidationError(`Você pode escolher no máximo ${group.maxSelect} opções em "${group.name}".`);
          return;
        }
        setSelectedByGroup((prev) => ({
          ...prev,
          [group.id]: [...currentList, option],
        }));
      }
    }
  };

  const handleAddToCart = () => {
    // Validate required groups
    for (const group of product.optionGroups) {
      const selected = selectedByGroup[group.id] || [];
      if (group.required && selected.length < (group.minSelect || 1)) {
        setValidationError(`Por favor, selecione ao menos ${group.minSelect || 1} opção em "${group.name}".`);
        return;
      }
    }

    const flatSelectedOptions: SelectedOption[] = [];
    for (const group of product.optionGroups) {
      const selected = selectedByGroup[group.id] || [];
      for (const opt of selected) {
        flatSelectedOptions.push({
          optionId: opt.id,
          groupName: group.name,
          optionName: opt.name,
          price: Number(opt.price),
        });
      }
    }

    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: basePrice,
      quantity,
      notes: notes.trim() || undefined,
      selectedOptions: flatSelectedOptions,
    });

    router.push(`/r/${restaurantSlug}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pt-4 pb-28">
      {/* Back Button */}
      <Link
        href={`/r/${restaurantSlug}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao cardápio
      </Link>

      {/* Product Information */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs mb-6">
        <h1 className="text-xl font-bold text-neutral-900">{product.name}</h1>
        {product.description && (
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <div className="mt-3 text-lg font-bold text-neutral-900">
          R$ {basePrice.toFixed(2).replace(".", ",")}
        </div>
      </div>

      {/* Option Groups */}
      <div className="space-y-6">
        {product.optionGroups.map((group) => {
          const selected = selectedByGroup[group.id] || [];
          const isSingle = group.maxSelect === 1;

          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{group.name}</h3>
                  <p className="text-[11px] text-neutral-500">
                    {group.required ? "Obrigatório" : "Opcional"} •{" "}
                    {isSingle ? (
                      "Escolha 1"
                    ) : (
                      <span>
                        Escolha até {group.maxSelect}{" "}
                        <span className="font-semibold text-neutral-700">
                          ({selected.length} de {group.maxSelect} selecionados)
                        </span>
                      </span>
                    )}
                  </p>
                </div>
                {group.required && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Obrigatório
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {group.options.map((option) => {
                  const isChecked = selected.some((o) => o.id === option.id);
                  const optPrice = Number(option.price);

                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => handleSelectOption(group, option)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs transition-all ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium"
                          : "border-neutral-200 hover:border-neutral-300 text-neutral-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-${
                            isSingle ? "full" : "md"
                          } border flex items-center justify-center ${
                            isChecked
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-neutral-300 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{option.name}</span>
                      </div>
                      {optPrice > 0 ? (
                        <span className="text-neutral-600 font-semibold">
                          + R$ {optPrice.toFixed(2).replace(".", ",")}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Grátis</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Special Instructions / Notes */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-xs">
          <label htmlFor="notes" className="block text-sm font-bold text-neutral-900 mb-1">
            Alguma observação?
          </label>
          <p className="text-[11px] text-neutral-500 mb-2">
            Ex: Sem cebola, molho à parte, bem passado...
          </p>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            placeholder="Digite suas preferências..."
            className="w-full text-xs p-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {validationError && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {validationError}
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 z-40">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center border border-neutral-200 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900 disabled:opacity-30"
              aria-label="Diminuir quantidade"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
              aria-label="Aumentar quantidade"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-between text-sm"
          >
            <span>Adicionar</span>
            <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
