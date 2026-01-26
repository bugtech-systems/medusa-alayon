import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { B2BCart } from "@/types/global"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { OrderSummary } from "@/components/store/checkout/order-summary";
import Wrapper from "@/modules/checkout/components/payment-wrapper"
import CheckoutForm from "@/components/store/checkout/checkout-form";
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Button from "@/modules/common/components/button"
import UTurnArrowRight from "@/modules/common/icons/u-turn-arrow-right"
import CheckoutSummary from "@/modules/checkout/templates/checkout-summary"
import { StoreCart } from "@medusajs/types"


export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const cartId = await searchParams?.cartId as string
  const cart = (await retrieveCart(cartId)) as B2BCart

  if (!cart) {
    return notFound()
  }

  // const customer = await retrieveCustomer()




  return (
    <Wrapper cart={cart}>
          <div className="grid grid-cols-1 md:grid-cols-5 mx-auto gap-4 md:gap-12 justify-center content-container w-full  md:w-3/4 h-full">
      
          <div className="md:col-span-3 order-first">
              <LocalizedClientLink
          className="flex items-baseline gap-2 text-sm text-neutral-400 hover:text-neutral-500"
          href="/cart"
        >
          <Button variant="secondary">
            <UTurnArrowRight />
            Back to shopping cart
          </Button>
        </LocalizedClientLink>
        </div>
      
      <div className="md:col-span-3">
        <CheckoutForm cart={cart} />
      </div>
      <div className="md:col-span-2 order-first md:order-last">
          <CheckoutSummary cart={cart} />
      </div>
    </div>
    </Wrapper>
  )
}
