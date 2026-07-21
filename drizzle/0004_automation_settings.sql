CREATE TABLE `automation_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL UNIQUE,
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
