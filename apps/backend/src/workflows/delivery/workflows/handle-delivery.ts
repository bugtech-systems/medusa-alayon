import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/workflows-sdk";
import {
  awaitDeliveryStep,
  awaitPickUpStep,
  awaitPreparationStep,
  awaitStartPreparationStep,
  createFulfillmentStep,
  createOrderStep,
  findDriverStep,
  notifyCompanyStep,
  setTransactionIdStep,
} from "../../delivery/steps";

type WorkflowInput = {
  delivery_id: string;
};

const TWO_HOURS = 60 * 60 * 2;
export const handleDeliveryWorkflowId = "handle-delivery-workflow";
export const handleDeliveryWorkflow = createWorkflow(
  {
    name: handleDeliveryWorkflowId,
    store: true,
    retentionTime: TWO_HOURS,
  },
  function (input: WorkflowData<WorkflowInput>): WorkflowResponse<string> {
    setTransactionIdStep(input.delivery_id);

    notifyCompanyStep(input.delivery_id);

    findDriverStep(input.delivery_id);

    const order = createOrderStep(input.delivery_id);

    awaitStartPreparationStep();

    awaitPreparationStep();

    createFulfillmentStep(order);

    awaitPickUpStep();

    awaitDeliveryStep();

    return new WorkflowResponse("Delivery completed");
  }
);
