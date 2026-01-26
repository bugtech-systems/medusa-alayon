import { retrieveCart } from "@/lib/data1";
import { cookies } from "next/headers";
import CartButton from "./cart-button";

export default async function NavCart() {
  const coockies = await cookies();
  const cartId = coockies.get("_medusa_cart_id")?.value;
  let cart;

  if (cartId) {
    cart = await retrieveCart(cartId);
  }

  return (
    <div className="relative">
      <CartButton cart={cart} />
    </div>
  );
}
