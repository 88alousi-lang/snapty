CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50) NOT NULL,
	`stripePayoutId` varchar(255),
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`)
);
