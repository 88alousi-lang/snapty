CREATE TABLE `pricing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`minSqft` int NOT NULL,
	`maxSqft` int,
	`price` decimal(10,2) NOT NULL,
	`label` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('booking_confirmation','booking_accepted','booking_rejected','pre_shoot_reminder','booking_completed','review_request','payment_confirmation','photographer_approved','new_booking_request') NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `stripeSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `photographers` ADD `isApproved` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `services` ADD `serviceType` enum('base','addon') DEFAULT 'base' NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `sortOrder` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `services` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;