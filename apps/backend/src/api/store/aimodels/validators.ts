import { z } from "zod";
// api/validators/ai-models.ts
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";



// types/ai.ts
export enum AiModelStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export enum AiConversationScope {
  ORDER = "order",
  CART = "cart",
  CUSTOMER = "customer",
  ADMIN = "admin",
  GLOBAL = "global",
}

export enum AiMessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}


export type AdminCreateAiModelType = z.infer<typeof AdminCreateAiModel>;
export const AdminCreateAiModel = z
  .object({
    name: z.string(),
    version: z.string().optional(),
    ollama_tag: z.string(),
    base_model: z.string(),
    modelfile: z.string(),
    system_prompt: z.string().optional(),
    parameters: z.record(z.any()).optional(),
  })
  .strict();



export type AdminGetAiModelsType = z.infer<typeof AdminGetAiModels>;
export const AdminGetAiModels = createFindParams()
  .merge(
    z.object({
      name: z.union([z.string(), z.array(z.string()), createOperatorMap()]).optional(),
      base_model: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
      status: z
        .union([
          z.nativeEnum(AiModelStatus),
          z.array(z.nativeEnum(AiModelStatus)),
          createOperatorMap(),
        ])
        .optional(),
    })
  )
  .strict();



export type AdminUpdateAiModelType = z.infer<typeof AdminUpdateAiModel>;
export const AdminUpdateAiModel = z
  .object({
    name: z.string().optional(),
    system_prompt: z.string().optional(),
    parameters: z.record(z.any()).optional(),
    status: z.nativeEnum(AiModelStatus).optional(),
  })
  .strict();
