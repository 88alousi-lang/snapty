CREATE TABLE `booking_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int,
	`fileType` varchar(50),
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `booking_photos_id` PRIMARY KEY(`id`)
);
