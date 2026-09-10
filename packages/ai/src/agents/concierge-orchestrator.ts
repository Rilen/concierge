import { CONCIERGE_SYSTEM_PROMPT } from "../prompts/concierge-system-prompt";
import { CONCIERGE_TOOLS } from "../tools/index";
import { LLMMessage } from "../providers/llm-provider";

export interface OrchestrationContext {
  conversationId: string;
  customerId?: string;
  channel: "WEB" | "WHATSAPP" | "TELEGRAM";
  externalSenderId?: string;
}

export interface AgentExecutionResponse {
  message: string;
  toolCallsExecuted: string[];
  suggestions: string[];
}

export class ConciergeOrchestrator {
  private systemPrompt = CONCIERGE_SYSTEM_PROMPT;
  private tools = CONCIERGE_TOOLS;

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  getTools() {
    return this.tools;
  }

  /**
   * Evaluates quick replies and suggestions for the user based on intent.
   */
  generateQuickReplies(lastUserMessage: string): string[] {
    const text = lastUserMessage.toLowerCase();
    if (text.includes("pizza")) {
      return ["Ver pizzarias abertas", "Pizzas 2 sabores", "Taxa de entrega"];
    }
    if (text.includes("reserva") || text.includes("mesa")) {
      return ["Reservar mesa para hoje", "Ver horários disponíveis"];
    }
    if (text.includes("pedido") || text.includes("onde está")) {
      return ["Rastrear meu pedido", "Falar com suporte"];
    }
    return ["Ver restaurantes abertos", "Fazer um pedido", "Reservar mesa", "Pedir recomendação"];
  }
}
