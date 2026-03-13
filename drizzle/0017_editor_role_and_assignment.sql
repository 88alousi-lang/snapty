-- Add editor role to users enum
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','photographer','editor','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint

-- Add editorId to bookings (FK to users.id where role=editor)
ALTER TABLE `bookings` ADD COLUMN `editorId` int;--> statement-breakpoint
