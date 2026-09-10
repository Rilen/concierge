import { z } from "zod";

export const bookTableToolSchema = z.object({
  restaurantSlug: z.string().describe("Slug do restaurante"),
  customerName: z.string().min(2).describe("Nome do cliente"),
  customerPhone: z.string().min(8).describe("Telefone de contato do cliente"),
  guestCount: z.number().int().min(1).max(20).describe("Quantidade de pessoas"),
  dateTimeIso: z.string().describe("Data e hora desejadas no formato ISO (ex: 2026-09-15T20:00:00Z)"),
  specialRequests: z.string().optional().describe("Observações ou pedidos especiais (ex: mesa na varanda, aniversário)"),
});

export type BookTableParams = z.infer<typeof bookTableToolSchema>;

export const bookTableToolDefinition = {
  name: "book_table",
  description: "Solicita ou confirma uma reserva de mesa em um restaurante cadastrado",
  parameters: bookTableToolSchema,
};
