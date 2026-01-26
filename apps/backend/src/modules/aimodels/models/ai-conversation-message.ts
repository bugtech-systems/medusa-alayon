import { model } from "@medusajs/framework/utils";
import { AiConversationSession } from "./ai-conversation-session";

export const AiConversationMessage = model.define(
  "ai_conversation_message",
  {
    id: model.id({ prefix: "acm" }).primaryKey(),
    role: model.enum(["system", "user", "assistant"]),
    content: model.text(),
    token_count: model.number(),
    score: model.float(),
    session: model.belongsTo(() => AiConversationSession, {
    foreignKey: true,
  }),
    
  }
);
