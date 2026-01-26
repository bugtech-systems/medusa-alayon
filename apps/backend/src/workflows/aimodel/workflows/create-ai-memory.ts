// workflows/create-ai-memory-workflow.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createAiMemoryStep } from "../steps/create-memory";

export const createAiMemoryWorkflow = createWorkflow(
  "create-ai-memory",
  (input: any) => {
    const memory = createAiMemoryStep(input);
    return new WorkflowResponse(memory);
  }
);
