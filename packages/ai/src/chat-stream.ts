import { streamText, type CoreMessage, type CoreTool } from "ai";
import { getGoogleModel, hasGoogleApiKey, GOOGLE_MODEL } from "./providers/google-provider";
import { CONCIERGE_SYSTEM_PROMPT } from "./prompts/concierge-system-prompt";
import { getAiSdkTools } from "./tools/index";
import { prisma } from "@concierge/database";

export interface ConciergeChatOptions {
  conversationId?: string;
  channel?: "WEB" | "WHATSAPP" | "TELEGRAM";
  externalSenderId?: string;
  modelName?: string;
  apiKey?: string;
  persistConversation?: boolean;
}

export async function streamConciergeChat(
  messages: CoreMessage[],
  options: ConciergeChatOptions = {}
): Promise<Response> {
  if (!hasGoogleApiKey() && !options.apiKey) {
    return new Response(
      JSON.stringify({ error: "Chave de API do Google não configurada." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = getGoogleModel(options.modelName, options.apiKey);
  const tools = getAiSdkTools();

  const result = streamText({
    model,
    system: CONCIERGE_SYSTEM_PROMPT,
    messages,
    tools: tools as Record<string, CoreTool>,
    onFinish: async (result) => {
      if (!options.persistConversation) return;

      try {
        let convId = options.conversationId;

        if (!convId) {
          const firstUserMsg = messages.find((m) => m.role === "user");
          const conversation = await prisma.conversation.create({
            data: {
              channel: options.channel ?? "WEB",
              externalSenderId: options.externalSenderId ?? null,
              title: firstUserMsg
                ? String(firstUserMsg.content).slice(0, 100)
                : null,
            },
          });
          convId = conversation.id;
        }

        const userMessages = messages.filter((m) => m.role === "user");
        for (const msg of userMessages) {
          await prisma.message.create({
            data: {
              conversationId: convId,
              role: "USER",
              content: String(msg.content ?? ""),
            },
          });
        }

        await prisma.message.create({
          data: {
            conversationId: convId,
            role: "ASSISTANT",
            content: result.text ?? "",
            toolCalls: result.toolCalls
              ? JSON.stringify(result.toolCalls)
              : undefined,
            toolResults: result.toolResults
              ? JSON.stringify(result.toolResults)
              : undefined,
          },
        });
      } catch (err) {
        console.error("Failed to persist conversation:", err);
      }
    },
  });

  return result.toTextStreamResponse();
}

export { GOOGLE_MODEL };
