// steps/generate-modelfile-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import fs from "fs/promises";
import path from "path";

export const generateModelfileStep = createStep(
  "generate-modelfile",
  async (input: {
    model_id: string;
    modelfile: string;
  }) => {
    const modelDir = path.resolve("ollama/models", input.model_id);
    await fs.mkdir(modelDir, { recursive: true });

    const filePath = path.join(modelDir, "Modelfile");
    await fs.writeFile(filePath, input.modelfile, "utf-8");

    return new StepResponse({ modelDir, filePath });
  }
);
