export * from "./search-catalog-tool";
export * from "./create-order-draft-tool";
export * from "./track-order-tool";
export * from "./book-table-tool";

import { tool } from "ai";
import { searchCatalogToolDefinition, executeSearchCatalog } from "./search-catalog-tool";
import { createOrderDraftToolDefinition, executeCreateOrderDraft } from "./create-order-draft-tool";
import { trackOrderToolDefinition, executeTrackOrder } from "./track-order-tool";

export const CONCIERGE_TOOLS = [
  searchCatalogToolDefinition,
  createOrderDraftToolDefinition,
  trackOrderToolDefinition,
];

export function getAiSdkTools() {
  return {
    [searchCatalogToolDefinition.name]: tool({
      description: searchCatalogToolDefinition.description,
      parameters: searchCatalogToolDefinition.parameters,
      execute: executeSearchCatalog,
    }),
    [createOrderDraftToolDefinition.name]: tool({
      description: createOrderDraftToolDefinition.description,
      parameters: createOrderDraftToolDefinition.parameters,
      execute: executeCreateOrderDraft,
    }),
    [trackOrderToolDefinition.name]: tool({
      description: trackOrderToolDefinition.description,
      parameters: trackOrderToolDefinition.parameters,
      execute: executeTrackOrder,
    }),
  };
}
