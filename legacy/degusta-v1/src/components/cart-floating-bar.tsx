"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { ShoppingBag } from "lucide-react";

export function CartFloatingBar({ slug }: { slug: string }) {
  const { totalQuantity, subtotal } = useCart();

  if (totalQuantity === 0) return null;

  const formattedSubtotal = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

  return (
    <div className="fixed bottom-4 inset-x-0 px-4 max-w-xl mx-auto z-40">
      <Link
        href={`/r/${slug}/carrinho`}
        className="flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-5 rounded-2xl shadow-lg transition-all transform active:scale-98"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-white text-emerald-800 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalQuantity}
            </span>
          </div>
          <span className="text-sm">Ver Sacola</span>
        </div>
        <span className="text-sm font-bold tracking-tight">{formattedSubtotal}</span>
      </Link>
    </div>
  );
}
