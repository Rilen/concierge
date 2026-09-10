export * from "./search-catalog-tool";
export * from "./create-order-draft-tool";
export * from "./track-order-tool";
export * from "./book-table-tool";

import { searchCatalogToolDefinition } from "./search-catalog-tool";
import { createOrderDraftToolDefinition } from "./create-order-draft-tool";
import { trackOrderToolDefinition } from "./track-order-tool";
import { bookTableToolDefinition } from "./book-table-tool";

export const CONCIERGE_TOOLS = [
  searchCatalogToolDefinition,
  createOrderDraftToolDefinition,
  trackOrderToolDefinition,
  bookTableToolDefinition,
];
