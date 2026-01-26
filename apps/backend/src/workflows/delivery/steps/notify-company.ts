import {
  ModuleRegistrationName,
  remoteQueryObjectFromString,
} from "@medusajs/utils";
import { createStep } from "@medusajs/workflows-sdk";

export const notifyCompanyStepId = "notify-company-step";
export const notifyCompanyStep = createStep(
  {
    name: notifyCompanyStepId,
    async: true,
    timeout: 60 * 15,
    maxRetries: 2,
  },
  async function (deliveryId: string, { container }) {
    const remoteQuery = container.resolve("remoteQuery");

    const deliveryQuery = remoteQueryObjectFromString({
      entryPoint: "deliveries",
      filters: {
        id: deliveryId,
      },
      fields: ["id", "company.id"],
    });

    const delivery = await remoteQuery(deliveryQuery).then((res) => res[0]);

    const eventBus = container.resolve(ModuleRegistrationName.EVENT_BUS);

    console.log('EMIITTIITNG', delivery, deliveryId)

    await eventBus.emit({
      name: "notify.company",
      data: {
        company_id: delivery.company.id,
        delivery_id: delivery.id,
      },
    });
  },
  function (input: any, { container }) {
    const logger = container.resolve("logger") as any;

    logger.error("Failed to notify restaurant", { input });
  }
);
