import { model } from "@medusajs/framework/utils";

export const AiToolExecution = model.define(
  "ai_tool_execution",
  {
    id: model.id({ prefix: "ate" }).primaryKey(),
    tool_name: model.text(),
    arguments: model.json(),
    status: model
      .enum(["pending", "running", "completed", "failed"])
      .default("pending"),
    result: model.json(),
    error: model.text(),
    completed_at: model.dateTime().nullable()
  }
);
