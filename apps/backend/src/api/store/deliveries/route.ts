import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/utils";
import zod from "zod";
import {
  createDeliveryWorkflow,
  handleDeliveryWorkflow,
} from "../../../workflows/delivery/workflows";

const schema = zod.object({
  cart_id: zod.string().startsWith("cart_"),
  company_id: zod.string().startsWith("comp_"),
});

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const validatedBody = schema.parse(req.body);


  console.log(req.body, validatedBody, 'VALLIDAT')

  const { result: delivery } = await createDeliveryWorkflow(req.scope).run({
    input: {
      cart_id: validatedBody.cart_id,
      company_id: validatedBody.company_id,
    },
  });


  console.log(delivery, 'DELIVERRY FLOW')

  const { transaction } = await handleDeliveryWorkflow(req.scope).run({
    input: {
      delivery_id: delivery.id,
    },
  });

  return res
    .status(200)
    .json({ message: "Delivery created", delivery, transaction });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const filters = {} as Record<string, any>;
  let take = parseInt(req.query.take as string) || 100;
  let skip = parseInt(req.query.skip as string) || 0;

  for (const key in req.query) {
    if (["take", "skip"].includes(key)) continue;

    filters[key] = req.query[key];
  }
  const deliveryQuery = {
    entity: "delivery",
    fields: ["*", "cart.*", "cart.items.*", "order.*", "order.items.*"],
    filters,
    pagination: {
      take,
      skip,
    },
  };

  const { data: deliveries } = await query.graph(deliveryQuery);

  if (filters.hasOwnProperty("driver_id")) {
    const driverQuery = {
      entity: "delivery_driver",
      fields: ["driver_id", "delivery_id"],
      filters: {
        deleted_at: null,
        driver_id: filters["driver_id"],
      },
    };

    const { data: availableDeliveriesIds } = await query.graph(driverQuery);

    const availableDeliveriesQuery = {
      entity: "delivery",
      fields: ["*", "cart.*", "cart.items.*", "order.*", "order.items.*"],
      filters: {
        id: availableDeliveriesIds.map((d) => d.delivery_id),
      },
    };

    const { data: availableDeliveries } = await query.graph(
      availableDeliveriesQuery
    );

    deliveries.push(...availableDeliveries);
  }

  return res.status(200).json({ deliveries });
}
