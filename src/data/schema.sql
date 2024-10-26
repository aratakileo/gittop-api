CREATE DATABASE IF NOT EXISTS popular_repositories;

CREATE TABLE IF NOT EXISTS owners (
    `id` integer PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS repositories (
    `id` integer PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `stars` integer NOT NULL,
    `description` TEXT NOT NULL,
    `lang` VARCHAR(255) NULL,
    `owner_id` integer NOT NULL,
    FOREIGN KEY (`owner_id`) REFERENCES owners(`id`)
);
