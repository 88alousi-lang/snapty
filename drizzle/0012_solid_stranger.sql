CREATE TABLE `photographer_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`city` varchar(100) NOT NULL,
	`yearsExperience` int,
	`equipmentUsed` text,
	`governmentIdUrl` varchar(500),
	`governmentIdType` varchar(50),
	`independentContractorAgreed` boolean NOT NULL DEFAULT false,
	`termsOfServiceAgreed` boolean NOT NULL DEFAULT false,
	`status` enum('pending','under_review','approved','rejected','more_info_required') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photographer_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photographer_portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`photoUrl` varchar(500) NOT NULL,
	`photoDescription` varchar(255),
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photographer_portfolios_id` PRIMARY KEY(`id`)
);
