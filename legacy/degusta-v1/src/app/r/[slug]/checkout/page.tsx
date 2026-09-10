import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/services/restaurant.service";
import { CheckoutForm } from "@/components/checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  return (
    <CheckoutForm
      restaurant={{
        slug: restaurant.slug,
        name: restaurant.name,
        status: restaurant.status,
        fixedDeliveryFee: restaurant.fixedDeliveryFee,
        estimatedTimeMin: restaurant.estimatedTimeMin,
        estimatedTimeMax: restaurant.estimatedTimeMax,
        deliveryEnabled: restaurant.deliveryEnabled,
        pickupEnabled: restaurant.pickupEnabled,
        paymentSettings: restaurant.paymentSettings,
      }}
    />
  );
}
