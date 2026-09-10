import { NextResponse } from "next/server";
import { getOrderByPublicId } from "@/services/order.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  const order = await getOrderByPublicId(publicId);

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ order });
}
