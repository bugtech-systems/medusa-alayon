import { StepResponse, createStep } from "@medusajs/workflows-sdk";
import { DeliveryDTO } from "../../../modules/delivery/types/common";
import { DELIVERY_MODULE } from "../../../modules/delivery";

export const createDeliveryStepId = "create-delivery-step";
export const createDeliveryStep = createStep(
  createDeliveryStepId,
  async function ({}, { container }) {
    const service = container.resolve(DELIVERY_MODULE) as any;
    
    const delivery = await service.createDeliveries({}) as DeliveryDTO

    return new StepResponse(delivery, {
      delivery_id: delivery.id,
    }) as any;
  },
  async function (
    {
      delivery_id,
    },
    { container }
  ) {
    const service = container.resolve(DELIVERY_MODULE);

    service.softDeleteDeliveries(delivery_id);
  }
);
