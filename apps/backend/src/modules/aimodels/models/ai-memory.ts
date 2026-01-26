import { model } from "@medusajs/framework/utils";

export const AiMemory = model.define("ai_memory", {
  id: model.id({ prefix: "aimem" }).primaryKey(),
  scope: model.text(),
  scope_id: model.text(),
  content: model.text(),
  // Store embeddings as array (pgvector will map automatically)
  embedding: model.json()
});
