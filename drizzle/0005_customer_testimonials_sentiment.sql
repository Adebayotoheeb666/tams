ALTER TABLE `customer_testimonials` ADD COLUMN `sentiment` text;
ALTER TABLE `customer_testimonials` ADD COLUMN `sentiment_score` integer DEFAULT 0;
