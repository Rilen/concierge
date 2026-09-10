import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurant.service";
import { getProductById } from "@/services/menu.service";
import { ProductCustomizer } from "@/components/product-customizer";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const product = await getProductById(id, restaurant.id);

  if (!product || !product.active) {
    notFound();
  }

  return <ProductCustomizer product={product} restaurantSlug={slug} />;
}
