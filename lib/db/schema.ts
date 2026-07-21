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
  status: text("status", {
    enum: ["draft", "sent", "pending", "partially-received", "received", "cancelled"],
  })
    .notNull()
    .default("draft"),
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
  quantityReceived: integer("quantity_received").notNull().default(0),
});

export const goodsReceivedNotes = sqliteTable("goods_received_notes", {
  id: text("id").primaryKey(),
  grnNumber: text("grn_number").notNull().unique(),
  purchaseOrderId: text("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  receivedDate: text("received_date").notNull(),
  notes: text("notes"),
  receivedBy: text("received_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const grnLineItems = sqliteTable("grn_line_items", {
  id: text("id").primaryKey(),
  grnId: text("grn_id").notNull().references(() => goodsReceivedNotes.id),
  productId: text("product_id").notNull().references(() => products.id),
  quantityReceived: integer("quantity_received").notNull(),
  quantityAccepted: integer("quantity_accepted").notNull(),
  quantityRejected: integer("quantity_rejected").notNull().default(0),
  notes: text("notes"),
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

export const goodsReceivedNotesRelations = relations(
  goodsReceivedNotes,
  ({ one, many }) => ({
    purchaseOrder: one(purchaseOrders, {
      fields: [goodsReceivedNotes.purchaseOrderId],
      references: [purchaseOrders.id],
    }),
    receiver: one(users, {
      fields: [goodsReceivedNotes.receivedBy],
      references: [users.id],
    }),
    lineItems: many(grnLineItems),
  })
);

export const grnLineItemsRelations = relations(grnLineItems, ({ one }) => ({
  grn: one(goodsReceivedNotes, {
    fields: [grnLineItems.grnId],
    references: [goodsReceivedNotes.id],
  }),
  product: one(products, {
    fields: [grnLineItems.productId],
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
export type Refund = typeof refunds.$inferSelect;

export const socialPosts = sqliteTable("social_posts", {
  id: text("id").primaryKey(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  platform: text("platform", { enum: ["instagram", "tiktok", "youtube"] }).notNull(),
  caption: text("caption").notNull(),
  imageUrl: text("image_url"),
  hashtags: text("hashtags"),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status", { enum: ["scheduled", "posting", "posted", "failed"] })
    .notNull()
    .default("scheduled"),
  externalId: text("external_id"),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  createdByUser: one(users, {
    fields: [socialPosts.createdBy],
    references: [users.id],
  }),
}));

export type SocialPost = typeof socialPosts.$inferSelect;

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

export const automationSettings = sqliteTable("automation_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  category: text("category").notNull(),
  label: text("label").notNull(),
  description: text("description"),
  type: text("type", { enum: ["boolean", "number", "text", "time"] }).notNull(),
  value: text("value").notNull(),
  defaultValue: text("default_value").notNull(),
  minValue: text("min_value"),
  maxValue: text("max_value"),
  options: text("options"),
  enabled: integer("enabled").notNull().default(1),
  updatedAt: text("updated_at").notNull(),
});

export type AutomationSetting = typeof automationSettings.$inferSelect;
export type AutomationSettingInsert = typeof automationSettings.$inferInsert;

// ============ MARKETING TABLES ============

export const marketingCampaigns = sqliteTable("marketing_campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", {
    enum: ["draft", "scheduled", "active", "completed", "paused"],
  })
    .notNull()
    .default("draft"),
  campaignType: text("campaign_type", {
    enum: ["product_launch", "flash_sale", "referral", "seasonal", "awareness"],
  }).notNull(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  targetPlatforms: text("target_platforms").notNull(), // JSON array: ['instagram', 'tiktok', 'whatsapp']
  goalDescription: text("goal_description"),
  budgetAllocation: integer("budget_allocation").default(0),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contentCalendar = sqliteTable("content_calendar", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => marketingCampaigns.id),
  platform: text("platform", {
    enum: ["instagram", "tiktok", "youtube", "whatsapp", "email"],
  }).notNull(),
  contentType: text("content_type", {
    enum: ["product_showcase", "behind_the_scenes", "social_proof", "tutorial", "engagement", "offer", "story"],
  }).notNull(),
  title: text("title").notNull(),
  caption: text("caption"),
  contentUrl: text("content_url"), // cloudinary link
  scheduledDate: text("scheduled_date"),
  postedDate: text("posted_date"),
  status: text("status", {
    enum: ["draft", "scheduled", "posted", "cancelled"],
  })
    .notNull()
    .default("draft"),
  hashtags: text("hashtags"), // JSON array
  targetAudience: text("target_audience"),
  expectedReach: integer("expected_reach").default(0),
  actualReach: integer("actual_reach").default(0),
  engagementRate: integer("engagement_rate").default(0), // percentage * 100
  callToAction: text("call_to_action"),
  bufferPostId: text("buffer_post_id"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  source: text("source", {
    enum: ["instagram_dm", "tiktok_comment", "whatsapp", "youtube_comment", "campus_popup", "referral", "other"],
  }).notNull(),
  sourceUrl: text("source_url"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  whatsappNumber: text("whatsapp_number"),
  interestedIn: text("interested_in"), // JSON array: ['thrift', 'nails']
  initialMessage: text("initial_message"),
  leadScore: integer("lead_score").default(0), // 0-100
  status: text("status", {
    enum: ["new", "contacted", "interested", "converted", "lost", "nurturing"],
  })
    .notNull()
    .default("new"),
  assignedTo: text("assigned_to").references(() => users.id),
  campaignId: text("campaign_id").references(() => marketingCampaigns.id),
  convertedCustomerId: text("converted_customer_id").references(() => customers.id),
  conversionDate: text("conversion_date"),
  followUpDate: text("follow_up_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const customerJourney = sqliteTable("customer_journey", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  leadId: text("lead_id").references(() => leads.id),
  stage: text("stage", {
    enum: ["awareness", "interest", "desire", "action", "loyalty"],
  })
    .notNull()
    .default("awareness"),
  stageEnteredAt: text("stage_entered_at").notNull(),
  touchpoints: text("touchpoints"), // JSON array of touchpoint ids
  lastInteraction: text("last_interaction"),
  lastInteractionDate: text("last_interaction_date"),
  lifetimeValue: integer("lifetime_value").default(0),
  nextAction: text("next_action"),
  nextActionDate: text("next_action_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const customerTestimonials = sqliteTable("customer_testimonials", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  productId: text("product_id").references(() => products.id),
  rating: integer("rating").notNull(), // 1-5
  textReview: text("text_review"),
  imageUrl: text("image_url"), // cloudinary link
  platformShared: text("platform_shared", {
    enum: ["instagram", "tiktok", "whatsapp", "in_person"],
  }).notNull(),
  status: text("status", {
    enum: ["pending_approval", "approved", "featured", "archived"],
  })
    .notNull()
    .default("pending_approval"),
  featuredUntil: text("featured_until"),
  engagementCount: integer("engagement_count").default(0),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: text("approved_at"),
  sentiment: text("sentiment", { enum: ["positive", "neutral", "negative"] }),
  sentimentScore: integer("sentiment_score"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const referralProgram = sqliteTable("referral_program", {
  id: text("id").primaryKey(),
  referrerCustomerId: text("referrer_customer_id").references(() => customers.id),
  referredCustomerId: text("referred_customer_id").references(() => customers.id),
  referralCode: text("referral_code").notNull().unique(),
  status: text("status", {
    enum: ["pending", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  rewardGivenAmount: integer("reward_given_amount").default(0),
  rewardGivenDate: text("reward_given_date"),
  referralDate: text("referral_date").notNull(),
  conversionDate: text("conversion_date"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const broadcastListMembers = sqliteTable("broadcast_list_members", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id),
  whatsappNumber: text("whatsapp_number").notNull(),
  firstName: text("first_name"),
  segment: text("segment", {
    enum: ["vip", "repeat_customer", "new_customer", "inactive", "all"],
  })
    .notNull()
    .default("all"),
  status: text("status", {
    enum: ["active", "unsubscribed", "bounced"],
  })
    .notNull()
    .default("active"),
  consentGiven: integer("consent_given").notNull().default(1),
  consentDate: text("consent_date"),
  lastBroadcastDate: text("last_broadcast_date"),
  broadcastsReceivedCount: integer("broadcasts_received_count").default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const whatsappBroadcasts = sqliteTable("whatsapp_broadcasts", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").references(() => marketingCampaigns.id),
  broadcastText: text("broadcast_text").notNull(),
  broadcastImageUrl: text("broadcast_image_url"),
  recipientsSegment: text("recipients_segment").notNull(), // 'vip', 'repeat_customer', 'all'
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  readCount: integer("read_count").default(0),
  clickCount: integer("click_count").default(0),
  scheduledDate: text("scheduled_date"),
  sentDate: text("sent_date"),
  status: text("status", {
    enum: ["draft", "scheduled", "sent", "failed"],
  })
    .notNull()
    .default("draft"),
  isABTest: integer("is_ab_test").notNull().default(0),
  parentBroadcastId: text("parent_broadcast_id"),
  variantLabel: text("variant_label"),
  winnerVariant: text("winner_variant"),
  bufferPostId: text("buffer_post_id"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const marketingKpis = sqliteTable("marketing_kpis", {
  id: text("id").primaryKey(),
  metricName: text("metric_name").notNull(), // 'instagram_followers', 'tiktok_views', etc.
  metricValue: integer("metric_value").notNull(),
  targetValue: integer("target_value"),
  period: text("period", {
    enum: ["daily", "weekly", "monthly", "6_month"],
  }).notNull(),
  periodStartDate: text("period_start_date").notNull(),
  periodEndDate: text("period_end_date"),
  platform: text("platform"), // 'instagram', 'tiktok', 'overall'
  dataSource: text("data_source"), // 'api_pull', 'manual_entry', 'calculated'
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ============ RELATIONS ============

export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [marketingCampaigns.createdBy],
    references: [users.id],
  }),
  contentCalendarItems: many(contentCalendar),
  leads: many(leads),
  broadcasts: many(whatsappBroadcasts),
}));

export const contentCalendarRelations = relations(contentCalendar, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [contentCalendar.campaignId],
    references: [marketingCampaigns.id],
  }),
  createdByUser: one(users, {
    fields: [contentCalendar.createdBy],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [leads.campaignId],
    references: [marketingCampaigns.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  convertedCustomer: one(customers, {
    fields: [leads.convertedCustomerId],
    references: [customers.id],
  }),
  journey: one(customerJourney, {
    fields: [leads.id],
    references: [customerJourney.leadId],
  }),
}));

export const customerJourneyRelations = relations(customerJourney, ({ one }) => ({
  customer: one(customers, {
    fields: [customerJourney.customerId],
    references: [customers.id],
  }),
  lead: one(leads, {
    fields: [customerJourney.leadId],
    references: [leads.id],
  }),
}));

export const customerTestimonialsRelations = relations(customerTestimonials, ({ one }) => ({
  customer: one(customers, {
    fields: [customerTestimonials.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [customerTestimonials.productId],
    references: [products.id],
  }),
  approvedByUser: one(users, {
    fields: [customerTestimonials.approvedBy],
    references: [users.id],
  }),
}));

export const referralProgramRelations = relations(referralProgram, ({ one }) => ({
  referrerCustomer: one(customers, {
    fields: [referralProgram.referrerCustomerId],
    references: [customers.id],
  }),
  referredCustomer: one(customers, {
    fields: [referralProgram.referredCustomerId],
    references: [customers.id],
  }),
}));

export const broadcastListMembersRelations = relations(broadcastListMembers, ({ one }) => ({
  customer: one(customers, {
    fields: [broadcastListMembers.customerId],
    references: [customers.id],
  }),
}));

export const whatsappBroadcastsRelations = relations(whatsappBroadcasts, ({ one }) => ({
  campaign: one(marketingCampaigns, {
    fields: [whatsappBroadcasts.campaignId],
    references: [marketingCampaigns.id],
  }),
  createdByUser: one(users, {
    fields: [whatsappBroadcasts.createdBy],
    references: [users.id],
  }),
}));
