CREATE TABLE `booking_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`serviceId` int NOT NULL,
	`price` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `photographerId` int;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `duration` int DEFAULT 120;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','accepted','rejected','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `bookings` ADD `propertyType` varchar(50);--> statement-breakpoint
ALTER TABLE `bookings` ADD `propertySize` int;--> statement-breakpoint
ALTER TABLE `bookings` ADD `basePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `bookings` ADD `addOnPrice` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `bookings` DROP COLUMN `serviceIds`;