// src/modules/action-engine/models/action-execution.ts
import { model } from "@medusajs/framework/utils"

export const ActionExecution = model.define("action_execution", {
  id: model.id().primaryKey(),
  execution_id: model.text(),
  action_id: model.text(),
  status: model.text().default("pending"), // 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input_data: model.json(),
  output_data: model.json(),
  error_message: model.text(),
  started_at: model.dateTime(),
  completed_at: model.dateTime(),
  duration_ms: model.number(),
  retry_count: model.number().default(0),
  logs: model.json(),
  metadata: model.json(),
})