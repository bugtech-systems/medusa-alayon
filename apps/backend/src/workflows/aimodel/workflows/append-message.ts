// workflows/append-message-workflow.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createConversationMessageStep } from "../steps/create-conversation-message";
import { CreateConversationMessageInput } from "@/modules/aimodels/types";

export const appendMessageWorkflow = createWorkflow(
  "append-ai-message",
  (input: CreateConversationMessageInput) => {
    const message = createConversationMessageStep(input);
    return new WorkflowResponse(message);
  }
);
