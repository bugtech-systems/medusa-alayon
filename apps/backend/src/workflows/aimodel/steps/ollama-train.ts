// steps/ollama-train-step.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { exec } from "child_process";

export const ollamaTrainStep = createStep(
  "ollama-train",
  async (input: {
    model_id: string;
    ollama_tag: string;
    modelDir: string;
  }) => {
    await execPromise(
      `ollama create ${input.ollama_tag} -f ${input.modelDir}/Modelfile`
    );

    await execPromise(`ollama push ${input.ollama_tag}`);

    return new StepResponse({ trained: true });
  }
);

function execPromise(cmd: string) {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, (err) => (err ? reject(err) : resolve()));
  });
}
