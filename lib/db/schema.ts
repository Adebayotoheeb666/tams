import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["owner", "staff", "accountant"] })
    .notNull()
    .default("staff"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  businessUnit: text("business_unit", { enum: ["thrift", "nails"] }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  businessUnit: text("business_unit", { enum: ["thrift", "nails"] }).notNull(),
  description: text("description"),
  costPrice: integer("cost_price").notNull(),
  sellingPrice: integer("selling_price").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(3),
  imageUrl: text("image_url"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  totalSpend: integer("total_spend").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: text("supplier_id").references(() => suppliers.id),
  orderDate: text("order_date").notNull(),
  totalAmount: integer("total_amount").notNull().default(0),
  status: text("status", { enum: ["pending", "received", "cancelled"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const purchaseOrderLines = sqliteTable("purchase_order_lines", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id),
  productId: text("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  orderDate: text("order_date").notNull(),
  subtotal: integer("subtotal").notNull(),
  discountAmount: integer("discount_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "transfer", "pos"],
  }).notNull(),
  paymentStatus: text("payment_status", {
    enum: ["paid", "partial", "unpaid"],
  }).notNull(),
  amountPaid: integer("amount_paid").notNull(),
  balanceDue: integer("balance_due").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});

export const refunds = sqliteTable("refunds", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  refundNumber: text("refund_number").notNull().unique(),
  reason: text("reason").notNull(),
  refundAmount: integer("refund_amount").notNull(),
  refundMethod: text("refund_method", {
    enum: ["cash", "transfer", "credit"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "processed", "rejected"],
  }).notNull().default("pending"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  delta: integer("delta").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["asset", "liability", "equity", "income", "cogs", "expense"],
  }).notNull(),
  normalBalance: text("normal_balance", { enum: ["debit", "credit"] }).notNull(),
  balance: integer("balance").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  entryDate: text("entry_date").notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type", {
    enum: ["sale", "purchase", "expense", "adjustment", "opening"],
  }).notNull(),
  referenceId: text("reference_id"),
  isReversed: integer("is_reversed").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const journalEntryLines = sqliteTable("journal_entry_lines", {
  id: text("id").primaryKey(),
  journalEntryId: text("journal_entry_id")
    .notNull()
    .references(() => journalEntries.id),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  entryType: text("entry_type", { enum: ["debit", "credit"] }).notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
});

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: integer("price").notNull(),
  materialsConsumed: text("materials_consumed"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  serviceId: text("service_id")
    .notNull()
    .references(() => services.id),
  appointmentDate: text("appointment_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status", {
    enum: ["booked", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
  }).notNull(),
  priceCharged: integer("price_charged").notNull(),
  notes: text("notes"),
  reminderSent: integer("reminder_sent").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  stockMovements: many(stockMovements),
  journalEntries: many(journalEntries),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  stockMovements: many(stockMovements),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  items: many(orderItems),
  refunds: many(refunds),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  lines: many(purchaseOrderLines),
}));

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderLines.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderLines.productId],
    references: [products.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
}));

export const journalEntriesRelations = relations(
  journalEntries,
  ({ one, many }) => ({
    createdByUser: one(users, {
      fields: [journalEntries.createdBy],
      references: [users.id],
    }),
    lines: many(journalEntryLines),
  }),
);

export const journalEntryLinesRelations = relations(
  journalEntryLines,
  ({ one }) => ({
    journalEntry: one(journalEntries, {
      fields: [journalEntryLines.journalEntryId],
      references: [journalEntries.id],
    }),
    account: one(accounts, {
      fields: [journalEntryLines.accountId],
      references: [accounts.id],
    }),
  }),
);

export const servicesRelations = relations(services, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
  createdByUser: one(users, {
    fields: [refunds.createdBy],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type AppointmentStatus = Appointment["status"];
export type UserRole = User["role"];
export type Supplier = typeof suppliers.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;

export const exportJobs = sqliteTable("export_jobs", {
  id: text("id").primaryKey(),
  jobType: text("job_type").notNull(),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  params: text("params"),
  fileUrl: text("file_url"),
  resultMessage: text("result_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const exportJobsRelations = relations(exportJobs, ({}) => ({}));

export type ExportJob = typeof exportJobs.$inferSelect;

export const periodLocks = sqliteTable("period_locks", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  lockedBy: text("locked_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const periodLocksRelations = relations(periodLocks, ({ one }) => ({
  user: one(users, { fields: [periodLocks.lockedBy], references: [users.id] }),
}));

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: text("user_id").references(() => users.id),
  payload: text("payload"),
  ip: text("ip"),
  createdAt: text("created_at").notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
