/**
 * PALADAR - Public Projection Sanitizer (C2)
 *
 * Implements strict projection for public customer-facing tracking views.
 * Ensures that administrative, internal, or financial margin fields
 * (such as platformFee, changedBy, internal IDs, and sensitive audit records)
 * are NEVER leaked through public APIs or tracking screens.
 */

export interface PublicRestaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  logoUrl?: string | null;
}

export interface PublicOrderItemOption {
  id: string;
  groupName: string;
  optionName: string;
  price: string;
}

export interface PublicOrderItem {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  notes?: string | null;
  options: PublicOrderItemOption[];
}

export interface PublicOrderStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string | Date;
}

export interface PublicOrder {
  id: string;
  publicId: string;
  orderNumber: number;
  type: string;
  status: string;
  customerName: string;
  customerPhone: string;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryComplement?: string | null;
  deliveryReference?: string | null;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
  paymentMethod: string;
  changeFor?: string | null;
  notes?: string | null;
  estimatedMinutes?: number | null;
  createdAt: string | Date;
  restaurant: PublicRestaurant;
  items: PublicOrderItem[];
  statusHistory: PublicOrderStatusHistory[];
}

export interface RawOrderItemOptionInput {
  id?: unknown;
  groupName?: unknown;
  optionName?: unknown;
  price?: unknown;
}

export interface RawOrderItemInput {
  id?: unknown;
  productName?: unknown;
  unitPrice?: unknown;
  quantity?: unknown;
  subtotal?: unknown;
  notes?: unknown;
  options?: RawOrderItemOptionInput[];
}

export interface RawStatusHistoryInput {
  id?: unknown;
  fromStatus?: unknown;
  toStatus?: unknown;
  note?: unknown;
  createdAt?: unknown;
}

export interface RawRestaurantInput {
  id?: unknown;
  name?: unknown;
  slug?: unknown;
  phone?: unknown;
  address?: unknown;
  logoUrl?: unknown;
}

export interface RawOrderInput {
  id?: unknown;
  publicId?: unknown;
  orderNumber?: unknown;
  type?: unknown;
  status?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  deliveryStreet?: unknown;
  deliveryNumber?: unknown;
  deliveryNeighborhood?: unknown;
  deliveryComplement?: unknown;
  deliveryReference?: unknown;
  subtotal?: unknown;
  deliveryFee?: unknown;
  discount?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  changeFor?: unknown;
  notes?: unknown;
  estimatedMinutes?: unknown;
  createdAt?: unknown;
  restaurant?: RawRestaurantInput | null;
  items?: RawOrderItemInput[];
  statusHistory?: RawStatusHistoryInput[];
}

/**
 * Strips all internal and administrative metadata from an order record,
 * returning ONLY safe customer-facing tracking data.
 *
 * Excluded fields:
 * - platformFee (Paladar commercial fee)
 * - changedBy in statusHistory (internal operator/user identities)
 * - customerId (internal DB relation)
 * - Any internal audit logs or merchant settings
 */
export function sanitizePublicOrder(rawOrder: RawOrderInput | null | undefined): PublicOrder | null {
  if (!rawOrder) return null;

  return {
    id: String(rawOrder.id),
    publicId: String(rawOrder.publicId),
    orderNumber: Number(rawOrder.orderNumber),
    type: String(rawOrder.type),
    status: String(rawOrder.status),
    customerName: String(rawOrder.customerName || ""),
    customerPhone: String(rawOrder.customerPhone || ""),
    deliveryStreet: rawOrder.deliveryStreet ? String(rawOrder.deliveryStreet) : null,
    deliveryNumber: rawOrder.deliveryNumber ? String(rawOrder.deliveryNumber) : null,
    deliveryNeighborhood: rawOrder.deliveryNeighborhood ? String(rawOrder.deliveryNeighborhood) : null,
    deliveryComplement: rawOrder.deliveryComplement ? String(rawOrder.deliveryComplement) : null,
    deliveryReference: rawOrder.deliveryReference ? String(rawOrder.deliveryReference) : null,
    subtotal: String(rawOrder.subtotal ?? "0.00"),
    deliveryFee: String(rawOrder.deliveryFee ?? "0.00"),
    discount: String(rawOrder.discount ?? "0.00"),
    total: String(rawOrder.total ?? "0.00"),
    paymentMethod: String(rawOrder.paymentMethod || ""),
    changeFor: rawOrder.changeFor ? String(rawOrder.changeFor) : null,
    notes: rawOrder.notes ? String(rawOrder.notes) : null,
    estimatedMinutes: rawOrder.estimatedMinutes != null ? Number(rawOrder.estimatedMinutes) : null,
    createdAt: (rawOrder.createdAt as string | Date) || new Date(),
    restaurant: {
      id: String(rawOrder.restaurant?.id || ""),
      name: String(rawOrder.restaurant?.name || ""),
      slug: String(rawOrder.restaurant?.slug || ""),
      phone: String(rawOrder.restaurant?.phone || ""),
      address: String(rawOrder.restaurant?.address || ""),
      logoUrl: rawOrder.restaurant?.logoUrl ? String(rawOrder.restaurant.logoUrl) : null,
    },
    items: Array.isArray(rawOrder.items)
      ? rawOrder.items.map((item: RawOrderItemInput) => ({
          id: String(item.id),
          productName: String(item.productName),
          unitPrice: String(item.unitPrice),
          quantity: Number(item.quantity),
          subtotal: String(item.subtotal),
          notes: item.notes ? String(item.notes) : null,
          options: Array.isArray(item.options)
            ? item.options.map((opt: RawOrderItemOptionInput) => ({
                id: String(opt.id),
                groupName: String(opt.groupName),
                optionName: String(opt.optionName),
                price: String(opt.price),
              }))
            : [],
        }))
      : [],
    statusHistory: Array.isArray(rawOrder.statusHistory)
      ? rawOrder.statusHistory.map((hist: RawStatusHistoryInput) => ({
          id: String(hist.id),
          fromStatus: hist.fromStatus ? String(hist.fromStatus) : null,
          toStatus: String(hist.toStatus),
          note: hist.note ? String(hist.note) : null,
          createdAt: (hist.createdAt as string | Date) || new Date(),
        }))
      : [],
  };
}
