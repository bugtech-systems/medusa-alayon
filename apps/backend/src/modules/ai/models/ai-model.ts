import { model } from "@medusajs/framework/utils"

export const AiModel = model.define("ai_model", {
  id: model.id({ prefix: "aimodel" }).primaryKey(),

  name: model.text(),
  provider: model.text(), 
  // "ollama"

  model_type: model.enum(["chat", "embedding"]),

  config: model.json(), 
  // temperature, context size, etc.
})
