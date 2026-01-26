// steps/mark-model-trained-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import AiModuleService from "../../../modules/aimodels/service";
import { AIMODEL_MODULE } from "@/modules/aimodels";

export const markModelTrainedStep = createStep(
  "mark-model-trained",
  async (id: any, { container }) => {
    const service = container.resolve<any>(AIMODEL_MODULE);
    const previous = await service.retrieveAiModel(id);

    const updated = await service.updateAiModels({
      id: id,
      status: "draft",
      metadata: { trained_at: new Date() },
  });

    return new StepResponse(updated, previous);
  },
  async (previous, { container }) => {
    if (!previous) return;
    const service = container.resolve<AiModuleService>(AIMODEL_MODULE);
    await service.updateAiModels(previous);
  }
);
