ALTER TABLE `reviews` ADD CONSTRAINT `reviews_bookingId_unique` UNIQUE(`bookingId`);--> statement-breakpoint
ALTER TABLE `portfolio_images` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `reviews` DROP COLUMN `title`;