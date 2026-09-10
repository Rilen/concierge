import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. AUTH & USERS (Better-Auth Compatible)
// ==========================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("CLIENTE").notNull(), // 'MASTER' | 'GERENTE' | 'PEDIDOS' | 'CLIENTE'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 2. RESTAURANTS & TENANCY
// ==========================================

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    openingHours: text("opening_hours").default("18:00 às 23:00").notNull(),
    status: text("status").default("CLOSED").notNull(), // 'OPEN' | 'CLOSED' | 'PAUSED'
    estimatedTimeMin: integer("estimated_time_min").default(20).notNull(),
    estimatedTimeMax: integer("estimated_time_max").default(45).notNull(),
    deliveryEnabled: boolean("delivery_enabled").default(true).notNull(),
    pickupEnabled: boolean("pickup_enabled").default(true).notNull(),
    fixedDeliveryFee: numeric("fixed_delivery_fee", { precision: 10, scale: 2 })
      .default("7.00")
      .notNull(),
    minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("restaurant_slug_idx").on(table.slug),
  ]
);

export const restaurantUsers = pgTable(
  "restaurant_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'GERENTE' | 'PEDIDOS'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("restaurant_users_tenant_idx").on(table.restaurantId, table.userId),
  ]
);

// ==========================================
// 3. MENU (CATEGORIES, PRODUCTS, OPTIONS)
// ==========================================

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("categories_restaurant_idx").on(table.restaurantId),
  ]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    active: boolean("active").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_restaurant_idx").on(table.restaurantId),
    index("products_category_idx").on(table.categoryId),
  ]
);

export const productOptionGroups = pgTable(
  "product_option_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Ponto da carne", "Borda", "Adicionais"
    minSelect: integer("min_select").default(0).notNull(),
    maxSelect: integer("max_select").default(1).notNull(),
    required: boolean("required").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("option_groups_product_idx").on(table.productId),
    index("option_groups_restaurant_idx").on(table.restaurantId),
  ]
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    optionGroupId: uuid("option_group_id")
      .notNull()
      .references(() => productOptionGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Ao ponto", "Bacon extra"
    price: numeric("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
    active: boolean("active").default(true).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("options_group_idx").on(table.optionGroupId),
    index("options_restaurant_idx").on(table.restaurantId),
  ]
);

// ==========================================
// 4. CUSTOMERS & ADDRESSES
// ==========================================

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    totalOrders: integer("total_orders").default(0).notNull(),
    totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).default("0.00").notNull(),
    firstOrderAt: timestamp("first_order_at"),
    lastOrderAt: timestamp("last_order_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("customers_phone_idx").on(table.restaurantId, table.phone),
  ]
);

export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement"),
    neighborhood: text("neighborhood").notNull(),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    reference: text("reference"),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("customer_addresses_idx").on(table.customerId),
  ]
);

// ==========================================
// 5. ORDERS & ORDER ITEMS (IMMUTABLE SNAPSHOTS)
// ==========================================

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicId: text("public_id").notNull().unique(), // Secure token for tracking (e.g. pld_abc123)
    orderNumber: integer("order_number").notNull(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    type: text("type").notNull(), // 'DELIVERY' | 'PICKUP'
    status: text("status").default("RECEIVED").notNull(),
    // 'RECEIVED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'PICKED_UP' | 'CANCELLED'

    // Delivery Address snapshot
    deliveryStreet: text("delivery_street"),
    deliveryNumber: text("delivery_number"),
    deliveryComplement: text("delivery_complement"),
    deliveryNeighborhood: text("delivery_neighborhood"),
    deliveryPostalCode: text("delivery_postal_code"),
    deliveryReference: text("delivery_reference"),

    // Financial calculations
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
    discount: numeric("discount", { precision: 10, scale: 2 }).default("0.00").notNull(),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).default("0.00").notNull(), // 0.5% Paladar fee

    // Payment details
    paymentMethod: text("payment_method").notNull(), // 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH'
    changeFor: numeric("change_for", { precision: 10, scale: 2 }), // If cash
    notes: text("notes"),
    estimatedMinutes: integer("estimated_minutes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_public_id_idx").on(table.publicId),
    uniqueIndex("orders_restaurant_order_number_idx").on(table.restaurantId, table.orderNumber),
    index("orders_restaurant_idx").on(table.restaurantId, table.createdAt),
    index("orders_status_idx").on(table.restaurantId, table.status),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: text("product_name").notNull(), // Snapshot
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(), // Snapshot
    quantity: integer("quantity").notNull(),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(), // Snapshot
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
  ]
);

export const orderItemOptions = pgTable(
  "order_item_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    productOptionId: uuid("product_option_id").references(() => productOptions.id, { onDelete: "set null" }),
    groupName: text("group_name").notNull(), // Snapshot
    optionName: text("option_name").notNull(), // Snapshot
    price: numeric("price", { precision: 10, scale: 2 }).default("0.00").notNull(), // Snapshot
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_item_options_item_idx").on(table.orderItemId),
  ]
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedBy: text("changed_by").notNull(), // User id, 'CLIENT', or 'SYSTEM'
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("order_status_history_order_idx").on(table.orderId),
  ]
);

// ==========================================
// 6. PAYMENTS
// ==========================================

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    method: text("method").notNull(), // 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH'
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").default("PENDING").notNull(), // 'PENDING' | 'CONFIRMED' | 'REFUNDED'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_restaurant_idx").on(table.restaurantId),
  ]
);

// ==========================================
// 7. DELIVERY & DRIVERS
// ==========================================

export const deliveryZones = pgTable(
  "delivery_zones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Centro", "Bairro X"
    fee: numeric("fee", { precision: 10, scale: 2 }).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("delivery_zones_restaurant_idx").on(table.restaurantId),
  ]
);

export const deliveryDrivers = pgTable(
  "delivery_drivers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("delivery_drivers_restaurant_idx").on(table.restaurantId),
  ]
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => deliveryDrivers.id, { onDelete: "set null" }),
    status: text("status").default("PENDING").notNull(), // 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("deliveries_order_idx").on(table.orderId),
  ]
);

export const deliveryTrackingPoints = pgTable(
  "delivery_tracking_points",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => deliveries.id, { onDelete: "cascade" }),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => [
    index("tracking_delivery_idx").on(table.deliveryId),
  ]
);

// ==========================================
// 8. LOYALTY
// ==========================================

export const loyaltyAccounts = pgTable(
  "loyalty_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    pointsBalance: integer("points_balance").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("loyalty_tenant_customer_idx").on(table.restaurantId, table.customerId),
  ]
);

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => loyaltyAccounts.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    type: text("type").notNull(), // 'EARN' | 'REDEEM' | 'ADJUSTMENT'
    points: integer("points").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("loyalty_trans_account_idx").on(table.accountId),
  ]
);

// ==========================================
// 9. SIMPLE STOCK
// ==========================================

export const stockItems = pgTable(
  "stock_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // e.g. "Pão", "Carne", "Queijo"
    unit: text("unit").default("un").notNull(), // 'un' | 'kg' | 'g' | 'l' | 'ml'
    currentQuantity: numeric("current_quantity", { precision: 10, scale: 3 }).default("0.000").notNull(),
    minQuantity: numeric("min_quantity", { precision: 10, scale: 3 }).default("0.000").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_items_restaurant_idx").on(table.restaurantId),
  ]
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stockItemId: uuid("stock_item_id")
      .notNull()
      .references(() => stockItems.id, { onDelete: "cascade" }),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'IN' | 'OUT' | 'ADJUSTMENT'
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    reason: text("reason"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_movements_item_idx").on(table.stockItemId),
    index("stock_movements_restaurant_idx").on(table.restaurantId),
  ]
);

// ==========================================
// 10. SETTINGS
// ==========================================

export const restaurantSettings = pgTable("restaurant_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  loyaltyPointsPerReal: numeric("loyalty_points_per_real", { precision: 10, scale: 2 }).default("1.00").notNull(),
  loyaltyRedemptionValue: numeric("loyalty_redemption_value", { precision: 10, scale: 2 }).default("0.05").notNull(),
  autoAcceptOrders: boolean("auto_accept_orders").default(false).notNull(),
  soundNotifications: boolean("sound_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  acceptsPix: boolean("accepts_pix").default(true).notNull(),
  pixKey: text("pix_key"),
  acceptsCredit: boolean("accepts_credit").default(true).notNull(),
  acceptsDebit: boolean("accepts_debit").default(true).notNull(),
  acceptsCash: boolean("accepts_cash").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 11. ADVERTISEMENTS & AUDIT LOGS
// ==========================================

export const advertisements = pgTable(
  "advertisements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    targetUrl: text("target_url"),
    active: boolean("active").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("advertisements_restaurant_idx").on(table.restaurantId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id").references(() => restaurants.id, { onDelete: "set null" }),
    userId: text("user_id"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata"), // JSON string
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_restaurant_idx").on(table.restaurantId),
    index("audit_logs_action_idx").on(table.action),
  ]
);

// ==========================================
// RELATIONS
// ==========================================

export const restaurantsRelations = relations(restaurants, ({ many, one }) => ({
  categories: many(categories),
  products: many(products),
  orders: many(orders),
  restaurantUsers: many(restaurantUsers),
  settings: one(restaurantSettings, {
    fields: [restaurants.id],
    references: [restaurantSettings.restaurantId],
  }),
  paymentSettings: one(paymentSettings, {
    fields: [restaurants.id],
    references: [paymentSettings.restaurantId],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [products.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  optionGroups: many(productOptionGroups),
}));

export const productOptionGroupsRelations = relations(productOptionGroups, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptionGroups.productId],
    references: [products.id],
  }),
  options: many(productOptions),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  group: one(productOptionGroups, {
    fields: [productOptions.optionGroupId],
    references: [productOptionGroups.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  payment: one(payments, {
    fields: [orders.id],
    references: [payments.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  options: many(orderItemOptions),
}));

export const orderItemOptionsRelations = relations(orderItemOptions, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [orderItemOptions.orderItemId],
    references: [orderItems.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [customers.restaurantId],
    references: [restaurants.id],
  }),
  addresses: many(customerAddresses),
  orders: many(orders),
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [customers.id],
    references: [loyaltyAccounts.customerId],
  }),
}));

export const restaurantUsersRelations = relations(restaurantUsers, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantUsers.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantUsers.userId],
    references: [users.id],
  }),
}));

