import { notFound } from "next/navigation";
import { getOrderByPublicId } from "@/services/order.service";
import { OrderTracker } from "@/components/order-tracker";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const order = await getOrderByPublicId(publicId);

  if (!order) {
    return { title: "Pedido não encontrado | PALADAR" };
  }

  return {
    title: `Pedido #${order.orderNumber} - ${order.restaurant.name} | PALADAR`,
    description: `Acompanhe seu pedido em tempo real no ${order.restaurant.name}.`,
  };
}

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const order = await getOrderByPublicId(publicId);

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <OrderTracker initialOrder={order} />
    </div>
  );
}
