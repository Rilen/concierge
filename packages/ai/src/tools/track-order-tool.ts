import { z } from "zod";
import { prisma } from "@concierge/database";
import { sanitizePublicOrder, type PublicOrder } from "@concierge/core";

export const trackOrderToolSchema = z.object({
  publicId: z.string().describe("Código ou token público do pedido (ex: pld_abc123)"),
});

export type TrackOrderParams = z.infer<typeof trackOrderToolSchema>;

export const trackOrderToolDefinition = {
  name: "track_order",
  description:
    "Consulta o status em tempo real de um pedido pelo código público de rastreamento.",
  parameters: trackOrderToolSchema,
};

export async function executeTrackOrder(
  params: TrackOrderParams
): Promise<PublicOrder | null> {
  const order = await prisma.order.findFirst({
    where: { publicId: params.publicId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          address: true,
          logoUrl: true,
        },
      },
      items: {
        include: {
          options: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!order) {
    return null;
  }

  return sanitizePublicOrder(order);
}
