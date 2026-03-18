export const OrderStatus = {
  CREATED: "CREATED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ShippingStatus = {
  PENDING: "PENDING",
  SHIPPED: "SHIPPED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type ShippingStatus =
  (typeof ShippingStatus)[keyof typeof ShippingStatus];

