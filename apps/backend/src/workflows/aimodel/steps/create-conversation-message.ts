// steps/create-conversation-message-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";
import { CreateConversationMessageInput } from "../../../modules/aimodels/types";

export const createConversationMessageStep = createStep(
  "create-conversation-message",
  async (input: CreateConversationMessageInput, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);

    const message = await service.createAiConversationMessages({
      ...input,
    });

    return new StepResponse(message, message.id);
  },
  async (messageId: string, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.deleteAiConversationMessages(messageId);
  }
);
