// workflows/train-ai-model-workflow.ts
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { generateModelfileStep } from "../steps/generate-modelfile";
import { ollamaTrainStep } from "../steps/ollama-train";
import { markModelTrainedStep } from "../steps/mark-model-trained";

export const trainAiModelWorkflow = createWorkflow(
  "train-ai-model",
  (input: {
    model_id: string;
    modelfile: string;
    ollama_tag: string;
    modelDir: string;
  }) => {
    const modelfile = generateModelfileStep(input);
    
    ollamaTrainStep({
      ...input,
      modelDir: modelfile.modelDir,
    });
    const model = markModelTrainedStep(input.model_id);

    return new WorkflowResponse(model);
  }
);
