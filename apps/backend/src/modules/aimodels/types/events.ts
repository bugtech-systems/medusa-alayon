/**
 * AI Event Types
 *
 * Represents the types of events that can trigger AI agents.
 */
export type AiEvent =
  | "order.created"
  | "order.refunded"
  | "cart.updated"
  | "customer.created"
  | "customer.updated"
  | "admin.manual_action";
