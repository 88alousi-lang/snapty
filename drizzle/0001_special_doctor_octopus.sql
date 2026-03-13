CREATE TABLE `availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`dayOfWeek` int,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`specificDate` datetime,
	`isAvailable` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingCode` varchar(20) NOT NULL,
	`clientId` int NOT NULL,
	`photographerId` int NOT NULL,
	`propertyAddress` text NOT NULL,
	`latitude` float,
	`longitude` float,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(10),
	`serviceIds` json,
	`scheduledDate` datetime NOT NULL,
	`duration` int,
	`specialInstructions` text,
	`totalPrice` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingCode_unique` UNIQUE(`bookingCode`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('booking_confirmation','booking_accepted','booking_rejected','pre_shoot_reminder','booking_completed','review_request','payment_confirmation') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text,
	`relatedBookingId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photographer_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`serviceId` int NOT NULL,
	`customPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photographer_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photographers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`profileImage` varchar(500),
	`yearsExperience` int,
	`latitude` float,
	`longitude` float,
	`address` text,
	`city` varchar(100),
	`state` varchar(50),
	`zipCode` varchar(10),
	`averageRating` decimal(3,2) DEFAULT '0',
	`totalReviews` int DEFAULT 0,
	`isVerified` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photographers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolio_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`title` varchar(200),
	`description` text,
	`isAiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolio_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`photographerId` int NOT NULL,
	`clientId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(200),
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`basePrice` decimal(10,2) NOT NULL,
	`deliveryTime` varchar(50),
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripeTransactionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','photographer','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);