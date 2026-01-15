import Service from "./service";
import { Module } from "@medusajs/utils";

export const DELIVERY_MODULE = "delivery";

export default Module(DELIVERY_MODULE, {
  service: Service,
});
