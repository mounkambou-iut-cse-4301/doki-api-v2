/*
  Warnings:

  - A unique constraint covering the columns `[ficheReponseId]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_receiverId_fkey`;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `casId` INTEGER NULL,
    ADD COLUMN `ficheId` INTEGER NULL,
    ADD COLUMN `ficheReponseId` INTEGER NULL,
    ADD COLUMN `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `kind` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'FICHE_REQUEST', 'FICHE_RESPONSE') NOT NULL DEFAULT 'TEXT',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `conversationId` INTEGER NULL,
    MODIFY `receiverId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CasDifficile` (
    `casId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `diseaseCode` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`casId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CasReadState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `casId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lastReadAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CasReadState_userId_idx`(`userId`),
    UNIQUE INDEX `CasReadState_casId_userId_key`(`casId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FicheStructuree` (
    `ficheId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FicheStructuree_createdBy_isActive_idx`(`createdBy`, `isActive`),
    PRIMARY KEY (`ficheId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FicheQuestion` (
    `ficheQuestionId` INTEGER NOT NULL AUTO_INCREMENT,
    `ficheId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,

    INDEX `FicheQuestion_ficheId_orderIndex_idx`(`ficheId`, `orderIndex`),
    PRIMARY KEY (`ficheQuestionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FicheReponse` (
    `ficheReponseId` INTEGER NOT NULL AUTO_INCREMENT,
    `ficheId` INTEGER NOT NULL,
    `conversationId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `submittedForUserId` INTEGER NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FicheReponse_conversationId_idx`(`conversationId`),
    INDEX `FicheReponse_ficheId_submittedAt_idx`(`ficheId`, `submittedAt`),
    PRIMARY KEY (`ficheReponseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FicheReponseItem` (
    `ficheReponseItemId` INTEGER NOT NULL AUTO_INCREMENT,
    `ficheReponseId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `valueText` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `FicheReponseItem_ficheReponseId_questionId_key`(`ficheReponseId`, `questionId`),
    PRIMARY KEY (`ficheReponseItemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Message_ficheReponseId_key` ON `Message`(`ficheReponseId`);

-- CreateIndex
CREATE INDEX `Message_casId_createdAt_idx` ON `Message`(`casId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Message_ficheId_idx` ON `Message`(`ficheId`);

-- CreateIndex
CREATE INDEX `Message_ficheReponseId_idx` ON `Message`(`ficheReponseId`);

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_casId_fkey` FOREIGN KEY (`casId`) REFERENCES `CasDifficile`(`casId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `FicheStructuree`(`ficheId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ficheReponseId_fkey` FOREIGN KEY (`ficheReponseId`) REFERENCES `FicheReponse`(`ficheReponseId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasDifficile` ADD CONSTRAINT `CasDifficile_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasReadState` ADD CONSTRAINT `CasReadState_casId_fkey` FOREIGN KEY (`casId`) REFERENCES `CasDifficile`(`casId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasReadState` ADD CONSTRAINT `CasReadState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheStructuree` ADD CONSTRAINT `FicheStructuree_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheQuestion` ADD CONSTRAINT `FicheQuestion_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `FicheStructuree`(`ficheId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponse` ADD CONSTRAINT `FicheReponse_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `FicheStructuree`(`ficheId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponse` ADD CONSTRAINT `FicheReponse_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`conversationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponse` ADD CONSTRAINT `FicheReponse_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponse` ADD CONSTRAINT `FicheReponse_submittedForUserId_fkey` FOREIGN KEY (`submittedForUserId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponseItem` ADD CONSTRAINT `FicheReponseItem_ficheReponseId_fkey` FOREIGN KEY (`ficheReponseId`) REFERENCES `FicheReponse`(`ficheReponseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheReponseItem` ADD CONSTRAINT `FicheReponseItem_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `FicheQuestion`(`ficheQuestionId`) ON DELETE RESTRICT ON UPDATE CASCADE;
