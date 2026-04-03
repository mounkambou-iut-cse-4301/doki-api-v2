/*
  Warnings:

  - You are about to drop the column `adminValidatorId` on the `Publicite` table. All the data in the column will be lost.
  - You are about to drop the column `annonceurId` on the `Publicite` table. All the data in the column will be lost.
  - You are about to drop the column `annonceurType` on the `Publicite` table. All the data in the column will be lost.
  - You are about to drop the column `typeContenu` on the `Publicite` table. All the data in the column will be lost.
  - You are about to drop the column `urlContenu` on the `Publicite` table. All the data in the column will be lost.
  - You are about to alter the column `statut` on the `Publicite` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(14))` to `Enum(EnumId(4))`.
  - Added the required column `cibleAudience` to the `Publicite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packagePubliciteId` to the `Publicite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `televerseParId` to the `Publicite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Publicite` DROP FOREIGN KEY `Publicite_adminValidatorId_fkey`;

-- DropForeignKey
ALTER TABLE `Publicite` DROP FOREIGN KEY `Publicite_annonceurId_fkey`;

-- DropIndex
DROP INDEX `Publicite_adminValidatorId_fkey` ON `Publicite`;

-- DropIndex
DROP INDEX `Publicite_annonceurId_fkey` ON `Publicite`;

-- AlterTable
ALTER TABLE `Publicite` DROP COLUMN `adminValidatorId`,
    DROP COLUMN `annonceurId`,
    DROP COLUMN `annonceurType`,
    DROP COLUMN `typeContenu`,
    DROP COLUMN `urlContenu`,
    ADD COLUMN `annonceurUtilisateurId` INTEGER NULL,
    ADD COLUMN `cibleAudience` ENUM('MEDECIN', 'PATIENT', 'LES_DEUX') NOT NULL,
    ADD COLUMN `emailAnnonceurExterne` VARCHAR(191) NULL,
    ADD COLUMN `nomAnnonceurExterne` VARCHAR(191) NULL,
    ADD COLUMN `packagePubliciteId` INTEGER NOT NULL,
    ADD COLUMN `telephoneAnnonceurExterne` VARCHAR(191) NULL,
    ADD COLUMN `televerseParId` INTEGER NOT NULL,
    MODIFY `description` TEXT NULL,
    MODIFY `statut` ENUM('EN_ATTENTE_PAIEMENT', 'ACTIVE', 'TERMINEE', 'ANNULEE') NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT';

-- CreateTable
CREATE TABLE `PackagePublicite` (
    `packagePubliciteId` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dureeJours` INTEGER NOT NULL,
    `montant` DECIMAL(10, 2) NOT NULL,
    `cibleAudience` ENUM('MEDECIN', 'PATIENT', 'LES_DEUX') NOT NULL,
    `nombreMaxImages` INTEGER NOT NULL DEFAULT 0,
    `nombreMaxVideos` INTEGER NOT NULL DEFAULT 0,
    `dureeMaxVideoSecondes` INTEGER NOT NULL DEFAULT 30,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PackagePublicite_actif_idx`(`actif`),
    PRIMARY KEY (`packagePubliciteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaPublicite` (
    `mediaPubliciteId` INTEGER NOT NULL AUTO_INCREMENT,
    `publiciteId` INTEGER NOT NULL,
    `typeMedia` ENUM('IMAGE', 'VIDEO') NOT NULL,
    `urlFichier` VARCHAR(191) NOT NULL,
    `dureeSecondes` INTEGER NULL,
    `ordreAffichage` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MediaPublicite_publiciteId_idx`(`publiciteId`),
    INDEX `MediaPublicite_typeMedia_idx`(`typeMedia`),
    PRIMARY KEY (`mediaPubliciteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Publicite_packagePubliciteId_idx` ON `Publicite`(`packagePubliciteId`);

-- CreateIndex
CREATE INDEX `Publicite_annonceurUtilisateurId_idx` ON `Publicite`(`annonceurUtilisateurId`);

-- CreateIndex
CREATE INDEX `Publicite_televerseParId_idx` ON `Publicite`(`televerseParId`);

-- CreateIndex
CREATE INDEX `Publicite_statut_idx` ON `Publicite`(`statut`);

-- CreateIndex
CREATE INDEX `Publicite_dateDebut_idx` ON `Publicite`(`dateDebut`);

-- CreateIndex
CREATE INDEX `Publicite_dateFin_idx` ON `Publicite`(`dateFin`);

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_packagePubliciteId_fkey` FOREIGN KEY (`packagePubliciteId`) REFERENCES `PackagePublicite`(`packagePubliciteId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_annonceurUtilisateurId_fkey` FOREIGN KEY (`annonceurUtilisateurId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_televerseParId_fkey` FOREIGN KEY (`televerseParId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaPublicite` ADD CONSTRAINT `MediaPublicite_publiciteId_fkey` FOREIGN KEY (`publiciteId`) REFERENCES `Publicite`(`publiciteId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Publicite` RENAME INDEX `Publicite_transactionId_fkey` TO `Publicite_transactionId_idx`;
