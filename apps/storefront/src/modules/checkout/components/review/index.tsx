"use client"

import { Text } from "@medusajs/ui"

import { checkSpendingLimit } from "@/lib/util/check-spending-limit"
import PaymentButton from "@/modules/checkout/components/payment-button"
import Button from "@/modules/common/components/button"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { B2BCart, B2BCustomer } from "@/types"
import { ExclamationCircle } from "@medusajs/icons"

const Review = ({
  cart,
  customer,
}: {
  cart: B2BCart
  customer: B2BCustomer | null
}) => {
  const spendLimitExceeded = customer
    ? checkSpendingLimit(cart, customer)
    : false

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-start gap-x-1 w-full">
        <Text className="txt-xsmall text-neutral-500 mb-1">
          By Completing this order, I agree to Medusa&apos;s{" "}
          <LocalizedClientLink
            href="/terms-of-sale"
            className="hover:text-neutral-800"
            target="_blank"
          >
            Terms of Sale ↗
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/privacy-policy"
            className="hover:text-neutral-800"
            target="_blank"
          >
            Privacy Policy ↗
          </LocalizedClientLink>
        </Text>
      </div>

    </div>
  )
}

export default Review
