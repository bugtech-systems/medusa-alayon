import { Module } from "@medusajs/framework/utils";
import AiModuleService from "./service";

export const AIMODEL_MODULE = "aimodelModuleService";

export default Module(AIMODEL_MODULE, { service: AiModuleService });
