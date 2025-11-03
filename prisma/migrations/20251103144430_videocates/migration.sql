/*
  Warnings:

  - You are about to drop the column `category` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Video` DROP COLUMN `category`,
    ADD COLUMN `categoryId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CategoryVideo` (
    `categoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CategoryVideo_name_key`(`name`),
    PRIMARY KEY (`categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CategoryVideoToVideo` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CategoryVideoToVideo_AB_unique`(`A`, `B`),
    INDEX `_CategoryVideoToVideo_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Video_categoryId_idx` ON `Video`(`categoryId`);

-- AddForeignKey
ALTER TABLE `_CategoryVideoToVideo` ADD CONSTRAINT `_CategoryVideoToVideo_A_fkey` FOREIGN KEY (`A`) REFERENCES `CategoryVideo`(`categoryId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryVideoToVideo` ADD CONSTRAINT `_CategoryVideoToVideo_B_fkey` FOREIGN KEY (`B`) REFERENCES `Video`(`videoId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Video` RENAME INDEX `Video_medecinId_fkey` TO `Video_medecinId_idx`;
