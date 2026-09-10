import { z } from "zod";

export const searchCatalogToolSchema = z.object({
  query: z.string().describe("Termo de busca, nome de prato, tipo de culinária ou restaurante"),
  openOnly: z.boolean().optional().default(true).describe("Filtrar apenas estabelecimentos abertos agora"),
  cuisine: z.string().optional().describe("Especialidade gastronômica (ex: pizza, burger, japonesa, frutos do mar)"),
  maxPriceTier: z.number().int().min(1).max(4).optional().describe("Faixa de preço máxima (1 a 4)"),
});

export type SearchCatalogParams = z.infer<typeof searchCatalogToolSchema>;

export interface SearchCatalogResultItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  restaurantName: string;
  restaurantSlug: string;
  isOpen: boolean;
  type: "RESTAURANT" | "PRODUCT";
}

export const searchCatalogToolDefinition = {
  name: "search_catalog",
  description: "Busca restaurantes, pratos e produtos disponíveis no marketplace Concierge / Ostras.ai",
  parameters: searchCatalogToolSchema,
};
