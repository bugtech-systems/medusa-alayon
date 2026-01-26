import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
    trainAiModelWorkflow
} from "../../../../../workflows/aimodel/workflows";
import {
  AdminGetAiModelsType,
} from "../../validators";
import { AIMODEL_MODULE } from "@/modules/aimodels";



export const GET = async (
  req: MedusaRequest<AdminGetAiModelsType>,
  res: MedusaResponse
) => {
  const { id } = req.params;

  const service = req.scope.resolve(AIMODEL_MODULE)

  const model = await service.retrieveAiModel(id);
await trainAiModelWorkflow.run({
      input: {
          model_id: model.id,
          ollama_tag: model.ollama_tag,
          modelfile: model.modelfile,
          modelDir: "ollama/models"
          }
  });
  res.json({ model });
};


