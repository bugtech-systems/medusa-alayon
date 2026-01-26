// steps/archive-ai-model-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AIMODEL_MODULE } from "../../../modules/aimodels";
import AiModuleService from "../../../modules/aimodels/service";

export const archiveAiModelStep = createStep(
  "archive-ai-model",
  async (id: string, { container }) => {
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);

    const previous = await service.retrieveAiModel(id);
    const updated = await service.updateAiModels({
      id,
      status: "archived",
    });

    return new StepResponse(updated, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.updateAiModels(previous);
  }
);
