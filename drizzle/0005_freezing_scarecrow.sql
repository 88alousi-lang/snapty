ALTER TABLE `photographers` ADD `onboardingStep` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `photographers` ADD `onboardingCompletedAt` timestamp;