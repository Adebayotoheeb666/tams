CREATE TABLE `broadcast_list_members` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`whatsapp_number` text NOT NULL,
	`first_name` text,
	`segment` text DEFAULT 'all' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`consent_given` integer DEFAULT 1 NOT NULL,
	`consent_date` text,
	`last_broadcast_date` text,
	`broadcasts_received_count` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `content_calendar` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text,
	`platform` text NOT NULL,
	`content_type` text NOT NULL,
	`title` text NOT NULL,
	`caption` text,
	`content_url` text,
	`scheduled_date` text,
	`posted_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`hashtags` text,
	`target_audience` text,
	`expected_reach` integer DEFAULT 0,
	`actual_reach` integer DEFAULT 0,
	`engagement_rate` integer DEFAULT 0,
	`call_to_action` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `marketing_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_journey` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`lead_id` text,
	`stage` text DEFAULT 'awareness' NOT NULL,
	`stage_entered_at` text NOT NULL,
	`touchpoints` text,
	`last_interaction` text,
	`last_interaction_date` text,
	`lifetime_value` integer DEFAULT 0,
	`next_action` text,
	`next_action_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text,
	`product_id` text,
	`rating` integer NOT NULL,
	`text_review` text,
	`image_url` text,
	`platform_shared` text NOT NULL,
	`status` text DEFAULT 'pending_approval' NOT NULL,
	`featured_until` text,
	`engagement_count` integer DEFAULT 0,
	`approved_by` text,
	`approved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_url` text,
	`first_name` text,
	`last_name` text,
	`email` text,
	`phone` text,
	`whatsapp_number` text,
	`interested_in` text,
	`initial_message` text,
	`lead_score` integer DEFAULT 0,
	`status` text DEFAULT 'new' NOT NULL,
	`assigned_to` text,
	`campaign_id` text,
	`converted_customer_id` text,
	`conversion_date` text,
	`follow_up_date` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaign_id`) REFERENCES `marketing_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`converted_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marketing_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`campaign_type` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`target_platforms` text NOT NULL,
	`goal_description` text,
	`budget_allocation` integer DEFAULT 0,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `marketing_kpis` (
	`id` text PRIMARY KEY NOT NULL,
	`metric_name` text NOT NULL,
	`metric_value` integer NOT NULL,
	`target_value` integer,
	`period` text NOT NULL,
	`period_start_date` text NOT NULL,
	`period_end_date` text,
	`platform` text,
	`data_source` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `referral_program` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_customer_id` text,
	`referred_customer_id` text,
	`referral_code` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`reward_given_amount` integer DEFAULT 0,
	`reward_given_date` text,
	`referral_date` text NOT NULL,
	`conversion_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`referrer_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`referred_customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referral_program_referral_code_unique` ON `referral_program` (`referral_code`);--> statement-breakpoint
CREATE TABLE `whatsapp_broadcasts` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text,
	`broadcast_text` text NOT NULL,
	`broadcast_image_url` text,
	`recipients_segment` text NOT NULL,
	`total_recipients` integer DEFAULT 0,
	`sent_count` integer DEFAULT 0,
	`read_count` integer DEFAULT 0,
	`click_count` integer DEFAULT 0,
	`scheduled_date` text,
	`sent_date` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `marketing_campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
