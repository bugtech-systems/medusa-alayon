import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/utils"
import { StoreRemoveLineItemsBulkType } from "../../../validators"
import { deleteLineItemsWorkflow } from "@medusajs/medusa/core-flows"

export async function POST(
  req: MedusaRequest<StoreRemoveLineItemsBulkType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { line_item_ids } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Ensure cart exists
  const {
    data: [cart],
  } = await query.graph(
    {
      entity: "cart",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  await deleteLineItemsWorkflow(req.scope).run({
    input: {
      cart_id: cart.id,
      ids: line_item_ids,
    },
  })

  // Fetch updated cart
  const {
    data: [updatedCart],
  } = await query.graph(
    {
      entity: "cart",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ cart: updatedCart })
}
