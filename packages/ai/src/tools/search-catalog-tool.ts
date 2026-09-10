import { z } from "zod";
import { prisma } from "@concierge/database";
import { Prisma } from "@prisma/client";

export const searchCatalogToolSchema = z.object({
  query: z
    .string()
    .describe("Termo de busca, nome de prato, tipo de culinária ou restaurante"),
  openOnly: z
    .boolean()
    .optional()
    .default(true)
    .describe("Filtrar apenas estabelecimentos abertos agora"),
  cuisine: z
    .string()
    .optional()
    .describe("Especialidade gastronômica (ex: pizza, burger, japonesa, frutos do mar)"),
  maxPriceTier: z
    .number()
    .int()
    .min(1)
    .max(4)
    .optional()
    .describe("Faixa de preço máxima (1 a 4)"),
});

export type SearchCatalogParams = z.infer<typeof searchCatalogToolSchema>;

export interface ProductOptionSummary {
  id: string;
  name: string;
  priceInCents: number;
  active: boolean;
}

export interface ProductOptionGroupSummary {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: ProductOptionSummary[];
}

export interface SearchCatalogResultItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  priceInCents?: number;
  restaurantName: string;
  restaurantSlug: string;
  isOpen: boolean;
  type: "RESTAURANT" | "PRODUCT";
  optionGroups?: ProductOptionGroupSummary[];
  categoryName?: string;
}

export const searchCatalogToolDefinition = {
  name: "search_catalog",
  description:
    "Busca restaurantes, pratos e produtos disponíveis no marketplace Concierge / Ostras.ai. " +
    "Permite busca por texto livre, categoria (ex.: pizza, lanche, bebida) e disponibilidade imediata. " +
    "Retorna estrutura limpa com id, name, description, priceInCents e grupos de complementos disponíveis.",
  parameters: searchCatalogToolSchema,
};

export async function executeSearchCatalog(
  params: SearchCatalogParams
): Promise<SearchCatalogResultItem[]> {
  const { query, openOnly = true, cuisine, maxPriceTier } = params;

  const whereClause: Prisma.RestaurantWhereInput = {};

  if (openOnly) {
    whereClause.status = "OPEN";
  }

  const hasQuery = query && query.trim().length > 0;
  const hasCuisine = cuisine && cuisine.trim().length > 0;
  const hasPriceTier = maxPriceTier !== undefined;

  if (hasQuery) {
    const q = query.trim();
    whereClause.OR = [
      { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      {
        products: {
          some: {
            active: true,
            OR: [
              { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            ],
          },
        },
      },
      {
        categories: {
          some: {
            active: true,
            name: { contains: q, mode: Prisma.QueryMode.insensitive },
          },
        },
      },
    ];
  }

  if (hasCuisine) {
    whereClause.AND = [
      { categories: { some: { name: { equals: cuisine, mode: Prisma.QueryMode.insensitive } } } },
    ];
  }

  if (hasPriceTier) {
    whereClause.priceTier = { lte: maxPriceTier };
  }

  const restaurants = await prisma.restaurant.findMany({
    where: whereClause,
    include: {
      categories: {
        where: { active: true },
        select: { id: true, name: true },
      },
      products: {
        where: { active: true },
        include: {
          optionGroups: {
            include: {
              options: {
                where: { active: true },
              },
            },
          },
          category: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { rating: "desc" },
  });

  const results: SearchCatalogResultItem[] = [];

  for (const rest of restaurants) {
    results.push({
      id: rest.id,
      name: rest.name,
      slug: rest.slug,
      description: rest.address,
      price: undefined,
      restaurantName: rest.name,
      restaurantSlug: rest.slug,
      isOpen: rest.status === "OPEN",
      type: "RESTAURANT",
    });

    for (const product of rest.products) {
      results.push({
        id: product.id,
        name: product.name,
        slug: rest.slug,
        description: product.description ?? undefined,
        price: Number(product.price),
        priceInCents: Math.round(Number(product.price) * 100),
        restaurantName: rest.name,
        restaurantSlug: rest.slug,
        isOpen: rest.status === "OPEN",
        type: "PRODUCT",
        categoryName: product.category?.name,
        optionGroups: product.optionGroups
          .filter((g) => g.options.length > 0 || g.required)
          .map((g) => ({
            id: g.id,
            name: g.name,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            required: g.required,
            options: g.options.map((o) => ({
              id: o.id,
              name: o.name,
              priceInCents: Math.round(Number(o.price) * 100),
              active: o.active,
            })),
          })),
      });
    }
  }

  return results;
}
