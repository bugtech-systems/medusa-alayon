// steps/create-conversation-session-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";
import { CreateConversationSessionInput } from "../../../modules/aimodels/types";

export const createConversationSessionStep = createStep(
  "create-conversation-session",
  async (input: CreateConversationSessionInput, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);

    const session = await service.createAiConversationSessions(input);

    return new StepResponse(session, session.id);
  },
  async (sessionId: string, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.deleteAiConversationSessions(sessionId);
  }
);
