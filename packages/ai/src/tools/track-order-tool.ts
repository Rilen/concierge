import { z } from "zod";

export const trackOrderToolSchema = z.object({
  publicId: z.string().describe("Código ou token público do pedido (ex: pld_abc123)"),
});

export type TrackOrderParams = z.infer<typeof trackOrderToolSchema>;

export const trackOrderToolDefinition = {
  name: "track_order",
  description: "Consulta o status em tempo real de um pedido pelo código público de rastreamento",
  parameters: trackOrderToolSchema,
};
