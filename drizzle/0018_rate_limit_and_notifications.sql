-- Rate limit log table for persistent rate limiting across restarts
CREATE TABLE IF NOT EXISTS `rate_limit_log` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `rl_key` varchar(255) NOT NULL,
  `user_id` int NOT NULL,
  `action` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rl_key_created` (`rl_key`, `created_at`)
);--> statement-breakpoint

-- Add photos_delivered to notifications enum
ALTER TABLE `notifications` MODIFY COLUMN `type` enum(
  'booking_confirmation',
  'booking_accepted',
  'booking_rejected',
  'pre_shoot_reminder',
  'booking_completed',
  'review_request',
  'payment_confirmation',
  'photographer_approved',
  'new_booking_request',
  'photos_delivered'
) NOT NULL;--> statement-breakpoint

-- Increase SSN/EIN/DOB column size to fit AES-256-GCM encrypted format (iv:tag:data)
ALTER TABLE `photographers` MODIFY COLUMN `ssn` varchar(200);--> statement-breakpoint
ALTER TABLE `photographers` MODIFY COLUMN `ein` varchar(200);--> statement-breakpoint
ALTER TABLE `photographers` MODIFY COLUMN `dateOfBirth` varchar(200);--> statement-breakpoint
