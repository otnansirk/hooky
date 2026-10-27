ALTER TABLE `endpoints` ADD `response_status` integer DEFAULT 200 NOT NULL;--> statement-breakpoint
ALTER TABLE `endpoints` ADD `response_content_type` text DEFAULT 'application/json' NOT NULL;--> statement-breakpoint
ALTER TABLE `endpoints` ADD `response_headers` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `endpoints` ADD `response_body` text;