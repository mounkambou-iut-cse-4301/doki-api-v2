/*
  Warnings:

  - A unique constraint covering the columns `[email,userType]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone,userType]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `User_email_key` ON `user`;

-- DropIndex
DROP INDEX `User_phone_key` ON `user`;

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_phone_idx` ON `User`(`phone`);

-- CreateIndex
CREATE UNIQUE INDEX `User_email_userType_key` ON `User`(`email`, `userType`);

-- CreateIndex
CREATE UNIQUE INDEX `User_phone_userType_key` ON `User`(`phone`, `userType`);
