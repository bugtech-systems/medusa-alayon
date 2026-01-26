import { model } from "@medusajs/framework/utils";

export const AiModel = model.define("ai_model", {
  id: model.id({ prefix: "aim" }).primaryKey(),
  name: model.text(),
  version: model.text(),
  ollama_tag: model.text(),
  base_model: model.text(),
  modelfile: model.text(),
  system_prompt: model.text(),
  parameters: model.json(),
  status: model
    .enum(["draft", "active", "archived"])
    .default("draft")
});
