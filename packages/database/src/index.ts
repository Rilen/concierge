export * from "./client";
export { prisma as db } from "./client";

export { Prisma } from "@prisma/client";
export type { PrismaClient } from "@prisma/client";
export type {
  Restaurant,
  Category,
  Product,
  ProductOptionGroup,
  ProductOption,
  Order,
  OrderItem,
  OrderItemOption,
  OrderStatusHistory,
  Conversation,
  Message,
} from "@prisma/client";
