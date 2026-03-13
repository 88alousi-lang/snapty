ALTER TABLE `notifications` MODIFY COLUMN `type` enum('booking_confirmation','booking_accepted','booking_rejected','pre_shoot_reminder','booking_completed','review_request','payment_confirmation','photographer_approved','new_booking_request','photos_delivered') NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `grossAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `transactions` ADD `photographerShare` decimal(10,2);--> statement-breakpoint
ALTER TABLE `transactions` ADD `platformFee` decimal(10,2);