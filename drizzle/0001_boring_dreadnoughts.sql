CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`service_id` text NOT NULL,
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text NOT NULL,
	`price_charged` integer NOT NULL,
	`notes` text,
	`reminder_sent` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`price` integer NOT NULL,
	`materials_consumed` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
