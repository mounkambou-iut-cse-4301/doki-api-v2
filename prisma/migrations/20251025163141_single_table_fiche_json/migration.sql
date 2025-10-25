/*
  Warnings:

  - You are about to drop the column `ficheReponseId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `FicheQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FicheReponse` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FicheReponseItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FicheStructuree` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `FicheQuestion` DROP FOREIGN KEY `FicheQuestion_ficheId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponse` DROP FOREIGN KEY `FicheReponse_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponse` DROP FOREIGN KEY `FicheReponse_ficheId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponse` DROP FOREIGN KEY `FicheReponse_senderId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponse` DROP FOREIGN KEY `FicheReponse_submittedForUserId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponseItem` DROP FOREIGN KEY `FicheReponseItem_ficheReponseId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheReponseItem` DROP FOREIGN KEY `FicheReponseItem_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `FicheStructuree` DROP FOREIGN KEY `FicheStructuree_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_ficheId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_ficheReponseId_fkey`;

-- DropIndex
DROP INDEX `Message_ficheReponseId_idx` ON `Message`;

-- DropIndex
DROP INDEX `Message_ficheReponseId_key` ON `Message`;

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `ficheReponseId`;

-- DropTable
DROP TABLE `FicheQuestion`;

-- DropTable
DROP TABLE `FicheReponse`;

-- DropTable
DROP TABLE `FicheReponseItem`;

-- DropTable
DROP TABLE `FicheStructuree`;

-- CreateTable
CREATE TABLE `Fiche` (
    `ficheId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `questions` JSON NOT NULL,
    `responses` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Fiche_createdBy_isActive_idx`(`createdBy`, `isActive`),
    PRIMARY KEY (`ficheId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `Fiche`(`ficheId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fiche` ADD CONSTRAINT `Fiche_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
