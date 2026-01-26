import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { RemoteQueryFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createAiModelWorkflow } from "../../../workflows/aimodel/workflows/create-ai-model";
import { CreateAiModelInput } from "@/modules/aimodels/types";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  console.log(req.query, 'req query')
  console.log(req.queryConfig, 'req query conf')
  const { fields, pagination } = req.queryConfig;

  const { data: models, metadata } = await query.graph({
    entity: "ai_model",
    fields,
    filters: {},
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  });

  res.json({
    models,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  const {
    result: createdModel,
  } = await createAiModelWorkflow(req.scope).run({
    input: req.body as CreateAiModelInput,
  });

  const {
    data: [aiModel],
  } = await query.graph(
    {
      entity: "ai_model",
      fields: req.queryConfig.fields,
      filters: { id: createdModel.id },
    },
    { throwIfKeyNotFound: true }
  );

  return res.json({ model: aiModel });
};
