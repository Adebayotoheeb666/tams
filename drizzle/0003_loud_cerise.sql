CREATE TABLE `automation_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`category` text NOT NULL,
	`label` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`value` text NOT NULL,
	`default_value` text NOT NULL,
	`min_value` text,
	`max_value` text,
	`options` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_settings_key_unique` ON `automation_settings` (`key`);--> statement-breakpoint
CREATE TABLE `goods_received_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`grn_number` text NOT NULL,
	`purchase_order_id` text NOT NULL,
	`received_date` text NOT NULL,
	`notes` text,
	`received_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goods_received_notes_grn_number_unique` ON `goods_received_notes` (`grn_number`);--> statement-breakpoint
CREATE TABLE `grn_line_items` (
	`id` text PRIMARY KEY NOT NULL,
	`grn_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity_received` integer NOT NULL,
	`quantity_accepted` integer NOT NULL,
	`quantity_rejected` integer DEFAULT 0 NOT NULL,
	`notes` text,
	FOREIGN KEY (`grn_id`) REFERENCES `goods_received_notes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`refund_number` text NOT NULL,
	`reason` text NOT NULL,
	`refund_amount` integer NOT NULL,
	`refund_method` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `refunds_refund_number_unique` ON `refunds` (`refund_number`);--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_by` text NOT NULL,
	`platform` text NOT NULL,
	`caption` text NOT NULL,
	`image_url` text,
	`hashtags` text,
	`scheduled_at` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`external_id` text,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX "accounts_code_unique";--> statement-breakpoint
DROP INDEX "automation_settings_key_unique";--> statement-breakpoint
DROP INDEX "goods_received_notes_grn_number_unique";--> statement-breakpoint
DROP INDEX "journal_entries_entry_number_unique";--> statement-breakpoint
DROP INDEX "orders_receipt_number_unique";--> statement-breakpoint
DROP INDEX "products_sku_unique";--> statement-breakpoint
DROP INDEX "purchase_orders_order_number_unique";--> statement-breakpoint
DROP INDEX "refunds_refund_number_unique";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
ALTER TABLE `purchase_orders` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'draft';--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_code_unique` ON `accounts` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entries_entry_number_unique` ON `journal_entries` (`entry_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_receipt_number_unique` ON `orders` (`receipt_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchase_orders_order_number_unique` ON `purchase_orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `purchase_order_lines` ADD `quantity_received` integer DEFAULT 0 NOT NULL;