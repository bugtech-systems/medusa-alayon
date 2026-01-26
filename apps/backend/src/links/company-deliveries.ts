import CompanyModule from "../modules/company";
import DeliveryModule from "../modules/delivery";
import { defineLink } from "@medusajs/utils";

export default defineLink(
  CompanyModule.linkable.company,
  {
    linkable: DeliveryModule.linkable.delivery,
    isList: true,
  }
);
