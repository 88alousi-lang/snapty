-- user_settings table: per-user notification and preference settings
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `emailNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `smsNotifications` tinyint(1) NOT NULL DEFAULT 0,
  `pushNotifications` tinyint(1) NOT NULL DEFAULT 1,
  `bookingAlerts` tinyint(1) NOT NULL DEFAULT 1,
  `weeklyDigest` tinyint(1) NOT NULL DEFAULT 0,
  `language` varchar(10) NOT NULL DEFAULT 'en',
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `dataCollection` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_settings_userId` (`userId`)
);--> statement-breakpoint

-- system_settings table: admin-controlled platform-wide settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` varchar(100) NOT NULL UNIQUE,
  `value` text NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);--> statement-breakpoint

-- Seed default system settings
INSERT IGNORE INTO `system_settings` (`key`, `value`) VALUES
  ('platformName', 'Snapty'),
  ('platformEmail', 'support@snapty.com'),
  ('supportPhone', ''),
  ('commissionRate', '0.35'),
  ('minBookingAmount', '99'),
  ('maxBookingAmount', '5000'),
  ('enableNotifications', 'true'),
  ('enableEmails', 'true'),
  ('maintenanceMode', 'false');
