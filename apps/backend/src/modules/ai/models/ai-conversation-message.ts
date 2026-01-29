import { model } from "@medusajs/framework/utils"

export const AiConversationMessage = model.define(
  "ai_conversation_message",
  {
    id: model.id({ prefix: "aimsg" }).primaryKey(),

    session_id: model.text(),

    role: model.enum(["system", "user", "assistant", "tool"]),
    content: model.text()
  }
)
