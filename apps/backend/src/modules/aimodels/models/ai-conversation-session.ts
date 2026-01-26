import { model } from "@medusajs/framework/utils";
import { AiConversationMessage } from "./ai-conversation-message";

export const AiConversationSession = model.define(
  "ai_conversation_session",
  {
    id: model.id({ prefix: "acs" }).primaryKey(),
    model_id: model.text(),
    scope: model.enum([
      "order",
      "cart",
      "customer",
      "admin",
      "global",
    ]),
    scope_id: model.text(),
    messages: model.hasMany(() => AiConversationMessage, {
    mappedBy: "session", // <-- should match the property in AiConversationMessage
  })
  }
);
