import { OrderStatus, OrderType, PaymentMethod } from "./calculations";

export interface OrderItemOptionSnapshot {
  id: string;
  groupName: string;
  optionName: string;
  price: number;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  options: OrderItemOptionSnapshot[];
}

export interface DeliveryAddressSnapshot {
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  reference?: string | null;
}

export interface OrderFinancialSummary {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  platformFee: number;
}

export interface OrderEntity {
  id: string;
  publicId: string;
  orderNumber: number;
  restaurantId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  deliveryAddress?: DeliveryAddressSnapshot | null;
  financial: OrderFinancialSummary;
  paymentMethod: PaymentMethod;
  changeFor?: number | null;
  notes?: string | null;
  estimatedMinutes?: number | null;
  items: OrderItemSnapshot[];
  createdAt: Date;
  updatedAt: Date;
}
