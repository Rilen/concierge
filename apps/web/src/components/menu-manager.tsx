"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategoryAction,
  createProductAction,
  configurePizzaFlavorsAction,
  createOptionAction,
} from "@/actions/menu.actions";
import { FolderPlus, PackagePlus, AlertCircle, Pizza } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    price: string;
    active: boolean;
    optionGroups: Array<{
      id: string;
      name: string;
      minSelect?: number;
      maxSelect?: number;
      required?: boolean;
      options: Array<{
        id: string;
        name: string;
        price: string;
      }>;
    }>;
  }>;
}

export function MenuManager({
  restaurantId,
  categories,
}: {
  restaurantId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals / Form States
  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || "");

  // Category form inputs
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Product form inputs
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pizza Flavor Configuration State
  const [selectedProductForPizza, setSelectedProductForPizza] = useState<Category["products"][number] | null>(null);
  const [selectedMaxFlavors, setSelectedMaxFlavors] = useState<number>(2);
  const [newFlavorName, setNewFlavorName] = useState("");
  const [newFlavorPrice, setNewFlavorPrice] = useState("");
  const [pizzaSuccessMsg, setPizzaSuccessMsg] = useState<string | null>(null);

  const getProductFlavorInfo = (prod: Category["products"][number]) => {
    const flavorGroups = prod.optionGroups.filter((g) =>
      g.name.toLowerCase().includes("sabor")
    );
    if (flavorGroups.length === 0) return null;
    if (flavorGroups.length > 1) {
      return {
        maxFlavors: Math.min(4, flavorGroups.length),
        group: flavorGroups[0],
        allGroups: flavorGroups,
      };
    }
    const g = flavorGroups[0];
    return {
      maxFlavors: Math.min(4, Math.max(1, g.maxSelect ?? 1)),
      group: g,
      allGroups: flavorGroups,
    };
  };

  const handleOpenPizzaModal = (prod: Category["products"][number]) => {
    const info = getProductFlavorInfo(prod);
    setSelectedMaxFlavors(info ? info.maxFlavors : 2);
    setSelectedProductForPizza(prod);
    setNewFlavorName("");
    setNewFlavorPrice("");
    setPizzaSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSavePizzaFlavors = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForPizza) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await configurePizzaFlavorsAction(restaurantId, {
        productId: selectedProductForPizza.id,
        maxFlavors: selectedMaxFlavors,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao salvar configuração da pizza.");
      } else {
        setSelectedProductForPizza(null);
        router.refresh();
      }
    });
  };

  const handleAddFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForPizza || !newFlavorName.trim()) return;

    const info = getProductFlavorInfo(selectedProductForPizza);
    if (!info || !info.group) {
      setErrorMsg("Salve a configuração da pizza antes de adicionar sabores.");
      return;
    }

    const numPrice = Number(newFlavorPrice.replace(",", ".")) || 0;

    startTransition(async () => {
      const res = await createOptionAction(restaurantId, {
        optionGroupId: info.group.id,
        name: newFlavorName.trim(),
        price: numPrice,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao adicionar sabor.");
      } else {
        setNewFlavorName("");
        setNewFlavorPrice("");
        setPizzaSuccessMsg("Sabor adicionado com sucesso!");
        router.refresh();
      }
    });
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createCategoryAction(restaurantId, {
        name: catName.trim(),
        description: catDesc.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao criar categoria");
      } else {
        setCatName("");
        setCatDesc("");
        setShowCatModal(false);
        router.refresh();
      }
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numPrice = Number(prodPrice.replace(",", "."));
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg("Informe um preço válido maior que zero.");
      return;
    }

    startTransition(async () => {
      const res = await createProductAction(restaurantId, {
        categoryId: selectedCatId,
        name: prodName.trim(),
        description: prodDesc.trim() || undefined,
        price: numPrice,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Erro ao criar produto");
      } else {
        setProdName("");
        setProdDesc("");
        setProdPrice("");
        setShowProdModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowCatModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Nova Categoria
        </button>

        <button
          type="button"
          onClick={() => setShowProdModal(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
        >
          <PackagePlus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* New Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Criar Categoria</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Pizzas Especiais"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Ex: Sabores exclusivos da casa"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {showProdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 mb-3">Criar Produto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Ex: Pizza Quatro Queijos"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Preço (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="Ex: 45,90"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ingredientes e detalhes..."
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pizza Flavor Configuration Modal */}
      {selectedProductForPizza && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Pizza className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Configuração da Pizza</h3>
                  <p className="text-[11px] text-neutral-500">{selectedProductForPizza.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForPizza(null)}
                className="text-neutral-400 hover:text-neutral-600 text-xs p-1"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>

            {pizzaSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {pizzaSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSavePizzaFlavors} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Máximo de sabores
                </label>
                <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
                  Defina quantos sabores diferentes o cliente poderá combinar ao pedir esta pizza.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 1, label: "1 sabor", desc: "Tradicional" },
                    { value: 2, label: "2 sabores", desc: "Meio a meio" },
                    { value: 3, label: "3 sabores", desc: "Até 3 sabores" },
                    { value: 4, label: "4 sabores", desc: "Até 4 sabores" },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedMaxFlavors === item.value
                          ? "border-amber-500 bg-amber-50/60 ring-1 ring-amber-500 text-amber-950 font-medium"
                          : "border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="maxFlavors"
                        value={item.value}
                        checked={selectedMaxFlavors === item.value}
                        onChange={() => setSelectedMaxFlavors(item.value)}
                        className="mt-0.5 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">{item.label}</span>
                        <span className="text-[10px] text-neutral-400 block">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Existing Flavors List */}
              {(() => {
                const info = getProductFlavorInfo(selectedProductForPizza);
                const allFlavors = info ? info.allGroups.flatMap((g) => g.options) : [];
                if (allFlavors.length === 0) return null;
                return (
                  <div className="pt-2 border-t border-neutral-100">
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Sabores cadastrados ({allFlavors.length})
                    </label>
                    <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
                      {allFlavors.map((opt) => (
                        <div
                          key={opt.id}
                          className="flex justify-between items-center py-1 px-2.5 rounded-lg bg-neutral-50 text-neutral-700 text-[11px]"
                        >
                          <span>{opt.name}</span>
                          {Number(opt.price) > 0 ? (
                            <span className="text-neutral-600 font-medium">
                              + R$ {Number(opt.price).toFixed(2).replace(".", ",")}
                            </span>
                          ) : (
                            <span className="text-neutral-400">Padrão</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Add New Flavor to this pizza */}
              {(() => {
                const info = getProductFlavorInfo(selectedProductForPizza);
                if (!info || !info.group) return null;
                return (
                  <div className="pt-2 border-t border-neutral-100">
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                      + Adicionar novo sabor a esta pizza
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFlavorName}
                        onChange={(e) => setNewFlavorName(e.target.value)}
                        placeholder="Ex: Marguerita Especial"
                        className="flex-1 text-xs p-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        value={newFlavorPrice}
                        onChange={(e) => setNewFlavorPrice(e.target.value)}
                        placeholder="Adic. R$"
                        className="w-20 text-xs p-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddFlavor}
                        disabled={!newFlavorName.trim() || isPending}
                        className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 disabled:opacity-40"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedProductForPizza(null)}
                  className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  {isPending ? "Salvando..." : "Salvar Configuração"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories & Products Tree */}
      <div className="space-y-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-neutral-500">{cat.description}</p>
                )}
              </div>
              <span className="text-[11px] font-semibold text-neutral-400">
                {cat.products.length} {cat.products.length === 1 ? "produto" : "produtos"}
              </span>
            </div>

            {cat.products.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                Nenhum produto cadastrado nesta categoria.
              </p>
            ) : (
              <div className="divide-y divide-neutral-50">
                {cat.products.map((prod) => {
                  const flavorInfo = getProductFlavorInfo(prod);
                  return (
                    <div key={prod.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-800">{prod.name}</h4>
                        {prod.description && (
                          <p className="text-[11px] text-neutral-500 line-clamp-1">
                            {prod.description}
                          </p>
                        )}
                        {prod.optionGroups.length > 0 && (
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            {prod.optionGroups.length} grupos de complementos
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPizzaModal(prod)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Pizza className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              {flavorInfo
                                ? `Configuração da Pizza: ${flavorInfo.maxFlavors} sabor${flavorInfo.maxFlavors > 1 ? "es" : ""}`
                                : "Configurar Sabores da Pizza"}
                            </span>
                          </button>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-neutral-900 shrink-0">
                        R$ {Number(prod.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
