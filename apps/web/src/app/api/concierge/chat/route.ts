import { NextRequest, NextResponse } from "next/server";
import { ConciergeOrchestrator } from "@concierge/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [] } = body;
    const lastMessage = messages[messages.length - 1]?.content || "";

    const orchestrator = new ConciergeOrchestrator();
    const quickReplies = orchestrator.generateQuickReplies(lastMessage);

    return NextResponse.json({
      message: {
        role: "assistant",
        content: `Recebi sua mensagem: "${lastMessage}". Estou consultando a base de dados do Concierge / Ostras.ai...`,
      },
      suggestions: quickReplies,
    });
  } catch (error) {
    console.error("Erro na rota /api/concierge/chat:", error);
    return NextResponse.json(
      { error: "Falha ao processar mensagem do Concierge" },
      { status: 500 }
    );
  }
}
