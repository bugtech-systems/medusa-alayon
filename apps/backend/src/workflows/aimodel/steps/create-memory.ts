// steps/create-ai-memory-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";
import { CreateAiMemoryInput } from "../../../modules/aimodels/types";

export const createAiMemoryStep = createStep(
  "create-ai-memory",
  async (input: any, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);

    const memory = await service.createAiMemories(input);

    return new StepResponse(memory, memory.id);
  },
  async (memoryId: string, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.deleteAiMemories(memoryId);
  }
);
