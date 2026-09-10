/**
 * CONCIERGE AGENT DOMAIN MODEL
 */

export type AgentIntent =
  | "DISCOVERY_RECOMMENDATION"
  | "MENU_INQUIRY"
  | "ORDER_CREATION"
  | "ORDER_STATUS_TRACKING"
  | "TABLE_BOOKING"
  | "LOCAL_GUIDE_INQUIRY"
  | "GENERAL_CONVERSATION"
  | "HUMAN_ESCALATION";

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface ToolCallPayload {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultPayload {
  toolCallId: string;
  name: string;
  result: unknown;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCallPayload[];
  toolResults?: ToolResultPayload[];
  createdAt: Date;
}

export interface ConversationSession {
  id: string;
  customerId?: string | null;
  channel: "WEB" | "WHATSAPP" | "TELEGRAM";
  externalSenderId?: string | null;
  activeIntent?: AgentIntent;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentActionSuggestion {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}
