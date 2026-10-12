CREATE TABLE `endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`last_active` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` text PRIMARY KEY NOT NULL,
	`endpoint_id` text NOT NULL,
	`method` text NOT NULL,
	`headers` text NOT NULL,
	`query_params` text NOT NULL,
	`body` text,
	`ip` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`endpoint_id`) REFERENCES `endpoints`(`id`) ON UPDATE no action ON DELETE cascade
);
