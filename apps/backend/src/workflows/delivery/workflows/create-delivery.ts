import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk";
import { Modules } from "@medusajs/utils"
import { createRemoteLinkStep } from "@medusajs/core-flows"
import { DeliveryDTO } from "../../../modules/delivery/types/common";
import { createDeliveryStep } from "../../delivery/steps";
import { DELIVERY_MODULE } from "../../../modules/delivery";
import { COMPANY_MODULE } from "../../../modules/company";

type WorkflowInput = {
  cart_id: string;
  company_id: string;
};

export const createDeliveryWorkflowId = "create-delivery-workflow";
export const createDeliveryWorkflow = createWorkflow(
  createDeliveryWorkflowId,
  function (input: WorkflowData<WorkflowInput>): WorkflowResponse<DeliveryDTO> {
    const delivery = createDeliveryStep(input) as any;
     
     
     
     
    const links = transform({
      input,
      delivery
    }, (data: any) => ([
      {
        [DELIVERY_MODULE]: {
          delivery_id: data.delivery.id
        },
        [Modules.CART]: {
          cart_id: data.input.cart_id
        }
      },
      {
        [COMPANY_MODULE]: {
          company_id: data.input.company_id
        },
        [DELIVERY_MODULE]: {
          delivery_id: data.delivery.id
        }
      }
    ])) as any

    createRemoteLinkStep(links)

    return new WorkflowResponse(delivery);
  }
);
