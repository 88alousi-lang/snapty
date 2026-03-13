-- Stripe webhook idempotency table — prevents double-processing events
CREATE TABLE IF NOT EXISTS `stripe_webhook_events` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_id` varchar(255) NOT NULL UNIQUE,
  `event_type` varchar(100) NOT NULL,
  `processed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_webhook_event_id` (`event_id`)
);
