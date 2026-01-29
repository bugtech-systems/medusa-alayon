import { model } from "@medusajs/framework/utils"

export const AiConversationSession = model.define(
  "ai_conversation_session",
  {
    id: model.id({ prefix: "aisess" }).primaryKey(),

    customer_id: model.text().nullable(),
    cart_id: model.text().nullable(),
    language: model.text().default("en")
  }
)
