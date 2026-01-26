// workflows/create-ai-model-workflow.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createAiModelStep } from "../steps/create-ai-model";
import { CreateAiModelInput } from "@/modules/aimodels/types";

export const createAiModelWorkflow = createWorkflow(
  "create-ai-model",
  (input: CreateAiModelInput) => {
    const model = createAiModelStep(input);
    return new WorkflowResponse(model);
  }
);
