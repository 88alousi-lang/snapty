CREATE TABLE `photographer_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`agreementType` enum('independent_contractor','photo_ownership','confidentiality','quality_standards','cancellation_policy','data_protection','ai_usage','drone_faa') NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`agreementVersion` varchar(10) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photographer_agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photographer_compliance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`complianceStatus` enum('compliant','warning','suspended','banned') NOT NULL DEFAULT 'compliant',
	`cancellationCount` int DEFAULT 0,
	`missedBookingCount` int DEFAULT 0,
	`qualityWarnings` int DEFAULT 0,
	`lastViolationAt` timestamp,
	`violationReason` text,
	`suspensionEndDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photographer_compliance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photographer_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photographerId` int NOT NULL,
	`documentType` enum('government_id','driver_license','passport','w9_form','faa_license','insurance_certificate') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`verificationNotes` text,
	`expiresAt` timestamp,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photographer_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `photographers` ADD `fullLegalName` varchar(255);--> statement-breakpoint
ALTER TABLE `photographers` ADD `dateOfBirth` varchar(10);--> statement-breakpoint
ALTER TABLE `photographers` ADD `ssn` varchar(11);--> statement-breakpoint
ALTER TABLE `photographers` ADD `ein` varchar(12);--> statement-breakpoint
ALTER TABLE `photographers` ADD `agreementAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `photographers` ADD `agreementVersion` varchar(10);--> statement-breakpoint
ALTER TABLE `photographers` ADD `backgroundCheckAuthorized` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `photographers` ADD `backgroundCheckCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `photographers` ADD `backgroundCheckStatus` enum('pending','approved','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `photographers` ADD `cameraType` varchar(255);--> statement-breakpoint
ALTER TABLE `photographers` ADD `hasDrone` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `photographers` ADD `droneServicesEnabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `photographers` ADD `faaLicenseExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `photographers` ADD `faaLicenseUploadedAt` timestamp;