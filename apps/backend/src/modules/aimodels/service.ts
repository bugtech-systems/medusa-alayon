import { MedusaService } from "@medusajs/utils";
import { AiConversationMessage, AiMemory, AiModel, AiConversationSession, AiToolExecution } from "./models";
const fetch = require("node-fetch");

class AiModuleService extends MedusaService({
  AiModel,
  AiMemory,
  AiConversationSession,
  AiConversationMessage,
  AiToolExecution
}) {}

export default AiModuleService;
