import { AIMODEL_MODULE } from './../modules/aimodels/index';

export async function runWorkflow(
  container,
  workflowId: string,
  input: any
) {
  const manager = container.resolve(AIMODEL_MODULE);
  return await manager.run(workflowId, input);
}
