ALTER TABLE `photographers` ADD `stripeConnectId` varchar(255);--> statement-breakpoint
ALTER TABLE `photographers` ADD `stripeConnectStatus` enum('not_connected','pending_verification','connected') DEFAULT 'not_connected' NOT NULL;--> statement-breakpoint
ALTER TABLE `photographers` ADD `bankAccountLast4` varchar(4);--> statement-breakpoint
ALTER TABLE `photographers` ADD `bankAccountName` varchar(100);--> statement-breakpoint
ALTER TABLE `photographers` ADD `payoutSchedule` varchar(50) DEFAULT 'daily';