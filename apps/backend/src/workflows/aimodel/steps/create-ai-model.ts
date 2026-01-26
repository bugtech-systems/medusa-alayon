// workflows/steps/create-ai-model-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";
import { CreateAiModelInput } from "../../../modules/aimodels/types";


export const createAiModelStep = createStep(
  "create-ai-model",
  async (input: CreateAiModelInput, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    const model = await service.createAiModels(input);
    return new StepResponse(model, model.id);
  },
  async (modelId, { container }) => {
    if (!modelId) return;
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.deleteAiModels(modelId);
  }
);
