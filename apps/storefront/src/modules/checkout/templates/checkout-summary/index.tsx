import { retrieveCompany, retrieveMerchant } from "@/lib/data"
import { retrieveCustomer } from "@/lib/data/customer"
import ItemsPreviewTemplate from "@/modules/cart/templates/preview"
import CheckoutTotals from "@/modules/checkout/components/checkout-totals"
import PromotionCode from "@/modules/checkout/components/promotion-code"
import Review from "@/modules/checkout/components/review"
import Divider from "@/modules/common/components/divider"
import { B2BCart } from "@/types"
import { Container, Heading } from "@medusajs/ui"

const CheckoutSummary = async ({ cart }: { cart: B2BCart }) => {
  const customer = await retrieveCustomer()
  const company = await retrieveMerchant(
    cart?.metadata?.company_id as string
  );
  
  


  return (
    <Container className="sticky h-fit w-full flex flex-col ">
    <Heading
        level="h3"
        className="text-md font-semibold text-ui-fg-base text-center"
      >
        Your order {company?.name && `from ${company?.name}`}
      </Heading>
      <Divider className="my-4" />

      <ItemsPreviewTemplate
        items={cart?.items}
        currencyCode={cart.currency_code}
      />
      
      <Divider className="my-2" />
      <CheckoutTotals cartOrOrder={cart} />
      <PromotionCode cart={cart} />
      <Divider className="my-2" />
      <Review cart={cart} customer={customer} />
    </Container>
  )
}

export default CheckoutSummary
