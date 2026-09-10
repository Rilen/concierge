export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMProvider {
  name: "gemini" | "openai" | "anthropic";
  generateText(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<string>;
  streamText?(messages: LLMMessage[], options?: LLMGenerateOptions): AsyncIterable<string>;
}
