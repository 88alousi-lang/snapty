ALTER TABLE `booking_photos` ADD `displayOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `booking_photos` ADD `isDeleted` boolean DEFAULT false NOT NULL;