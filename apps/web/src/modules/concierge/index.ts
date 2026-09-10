export interface ConciergeChatMessage {
  id: string;
  role: "user" | "concierge" | "system";
  content: string;
  timestamp: string;
}

export interface ConciergeState {
  messages: ConciergeChatMessage[];
  isLoading: boolean;
  activeIntent?: string;
}
