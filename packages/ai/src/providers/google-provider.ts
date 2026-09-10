import { google, createGoogleGenerativeAI } from "@ai-sdk/google";

export const GOOGLE_MODEL = "gemini-2.0-flash";

export function getGoogleModel(modelName?: string, apiKey?: string) {
  if (apiKey) {
    const provider = createGoogleGenerativeAI({ apiKey });
    return provider(modelName ?? GOOGLE_MODEL);
  }
  return google(modelName ?? GOOGLE_MODEL);
}

export function hasGoogleApiKey(): boolean {
  return (
    !!process.env.GOOGLE_API_KEY ||
    !!process.env.GOOGLE_GENERATIVE_API_KEY
  );
}
