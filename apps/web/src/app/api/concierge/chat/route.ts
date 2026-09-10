import { NextRequest, NextResponse } from "next/server";
import { type CoreMessage, streamConciergeChat } from "@concierge/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, conversationId, channel = "WEB", externalSenderId, persistConversation = false } = body;

    const coreMessages = (
      Array.isArray(messages)
        ? messages.map((m: { role: string; content: string }) => ({
            role: m.role as CoreMessage["role"],
            content: m.content,
          }))
        : []
    ) as CoreMessage[];

    return streamConciergeChat(coreMessages, {
      conversationId,
      channel: channel as "WEB" | "WHATSAPP" | "TELEGRAM",
      externalSenderId,
      persistConversation,
    });
  } catch (error) {
    console.error("Erro na rota /api/concierge/chat:", error);
    return NextResponse.json(
      { error: "Falha ao processar mensagem do Concierge" },
      { status: 500 }
    );
  }
}
