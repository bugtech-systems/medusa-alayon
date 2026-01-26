// workflows/start-conversation-workflow.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createConversationSessionStep } from "../steps/create-conversation-session";
import { CreateConversationSessionInput } from "@/modules/aimodels/types";

export const startConversationWorkflow = createWorkflow(
  "start-ai-conversation",
  (input: CreateConversationSessionInput) => {
    const session = createConversationSessionStep(input);
    return new WorkflowResponse(session);
  }
);
