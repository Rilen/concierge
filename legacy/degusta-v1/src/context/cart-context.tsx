"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface SelectedOption {
  optionId: string;
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  tempId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  selectedOptions: SelectedOption[];
  subtotal: number;
}

interface CartContextType {
  restaurantSlug: string;
  items: CartItem[];
  addItem: (item: Omit<CartItem, "tempId" | "subtotal">) => void;
  removeItem: (tempId: string) => void;
  updateQuantity: (tempId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  restaurantSlug,
  children,
}: {
  restaurantSlug: string;
  children: React.ReactNode;
}) {
  const storageKey = `paladar_cart_${restaurantSlug}`;

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`paladar_cart_${restaurantSlug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar carrinho:", e);
    }
  }, [items, storageKey]);

  const calculateSubtotal = (
    unitPrice: number,
    quantity: number,
    options: SelectedOption[]
  ) => {
    const optsPrice = options.reduce((sum, o) => sum + o.price, 0);
    return Math.round((unitPrice + optsPrice) * quantity * 100) / 100;
  };

  const addItem = (item: Omit<CartItem, "tempId" | "subtotal">) => {
    // Generate deterministic signature from options to merge identical items
    const optionsSignature = item.selectedOptions
      .map((o) => o.optionId)
      .sort()
      .join("|");
    const notesSignature = item.notes?.trim() || "";
    const signature = `${item.productId}::${optionsSignature}::${notesSignature}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.tempId === signature);
      if (existingIndex > -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + item.quantity;
        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          subtotal: calculateSubtotal(current.unitPrice, newQty, current.selectedOptions),
        };
        return updated;
      } else {
        const subtotal = calculateSubtotal(item.unitPrice, item.quantity, item.selectedOptions);
        return [
          ...prev,
          {
            ...item,
            tempId: signature,
            subtotal,
          },
        ];
      }
    });
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const updateQuantity = (tempId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(tempId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.tempId === tempId
          ? {
              ...i,
              quantity,
              subtotal: calculateSubtotal(i.unitPrice, quantity, i.selectedOptions),
            }
          : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const subtotal = Math.round(
    items.reduce((sum, item) => sum + item.subtotal, 0) * 100
  ) / 100;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        restaurantSlug,
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser utilizado dentro de um CartProvider");
  }
  return context;
}
