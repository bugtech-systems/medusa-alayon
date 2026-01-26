// steps/update-ai-model-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";
import { UpdateAiModelInput } from "../../../modules/aimodels/types";

export const updateAiModelStep = createStep(
  "update-ai-model",
  async (input: UpdateAiModelInput, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);

    const previous = await service.retrieveAiModel(input.id);
    const updated = await service.updateAiModels(input);

    return new StepResponse(updated, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.updateAiModels(previous);
  }
);
