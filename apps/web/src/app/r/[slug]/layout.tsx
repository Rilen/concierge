import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurant.service";
import { CartProvider } from "@/context/cart-context";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return {
      title: "Restaurante não encontrado | PALADAR",
    };
  }

  return {
    title: `${restaurant.name} | Cardápio Digital`,
    description: `Faça seu pedido online no ${restaurant.name}. Entrega rápida e retirada no local.`,
    openGraph: {
      title: `${restaurant.name} - Pedidos Online`,
      description: `Cardápio digital oficial de ${restaurant.name}`,
      images: restaurant.bannerUrl ? [restaurant.bannerUrl] : [],
    },
  };
}

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <CartProvider restaurantSlug={slug}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-24">
        {children}
      </div>
    </CartProvider>
  );
}
