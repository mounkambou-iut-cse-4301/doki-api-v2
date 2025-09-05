/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FormationContinue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lesson` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `FormationContinue` DROP FOREIGN KEY `FormationContinue_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `Lesson` DROP FOREIGN KEY `Lesson_formationContinueId_fkey`;

-- DropTable
DROP TABLE `Category`;

-- DropTable
DROP TABLE `FormationContinue`;

-- DropTable
DROP TABLE `Lesson`;

-- CreateTable
CREATE TABLE `categories` (
    `categoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `categories_name_idx`(`name`),
    PRIMARY KEY (`categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formations_continue` (
    `formationId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `competence` VARCHAR(191) NOT NULL,
    `dureeHeures` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `formations_continue_categoryId_name_idx`(`categoryId`, `name`),
    PRIMARY KEY (`formationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lessons` (
    `lessonId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `orderIndex` INTEGER NULL,
    `formationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lessons_formationId_orderIndex_idx`(`formationId`, `orderIndex`),
    PRIMARY KEY (`lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `formations_continue` ADD CONSTRAINT `formations_continue_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`categoryId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_formationId_fkey` FOREIGN KEY (`formationId`) REFERENCES `formations_continue`(`formationId`) ON DELETE RESTRICT ON UPDATE CASCADE;
