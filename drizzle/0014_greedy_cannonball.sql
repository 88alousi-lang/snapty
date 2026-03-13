CREATE TABLE `editor_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingCode` varchar(50) NOT NULL,
	`bookingId` int NOT NULL,
	`photographerId` int NOT NULL,
	`editorId` int NOT NULL,
	`overallRating` int NOT NULL,
	`photoQualityRating` int NOT NULL,
	`fileOrganizationRating` int NOT NULL,
	`instructionRating` int NOT NULL,
	`editingEaseRating` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `editor_ratings_id` PRIMARY KEY(`id`)
);
