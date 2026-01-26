// types/ai.ts
export type AiModelStatus = "draft" | "active" | "archived";

export interface CreateAiModelInput {
  name: string;
  version?: string;
  ollama_tag?: string;
  base_model?: string;
  modelfile?: string;
  system_prompt?: string;
  parameters?: Record<string, any>;
  status?: AiModelStatus;
}

export interface UpdateAiModelInput extends Partial<CreateAiModelInput> {
  id: string;
}

export interface CreateConversationSessionInput {
  model_id: string;
  scope: "order" | "cart" | "customer" | "admin" | "global";
  scope_id?: string;
}

export interface CreateConversationMessageInput {
  session_id: string;
  role: "system" | "user" | "assistant";
  content: string;
  token_count?: number;
  score?: number;
}

export interface CreateAiMemoryInput {
  scope: string;
  scope_id: string;
  content: string;
  embedding?: number[];
}


