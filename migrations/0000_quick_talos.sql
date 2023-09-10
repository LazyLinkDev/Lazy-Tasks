CREATE TABLE `todos` (
	`id` integer PRIMARY KEY NOT NULL,
	`message` text,
	`status` integer DEFAULT false
);
