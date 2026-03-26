/*
  Warnings:

  - You are about to drop the column `medecinId` on the `Abonnement` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Abonnement` DROP FOREIGN KEY `Abonnement_medecinId_fkey`;

-- DropIndex
DROP INDEX `Abonnement_medecinId_fkey` ON `Abonnement`;

-- AlterTable
ALTER TABLE `Abonnement` DROP COLUMN `medecinId`;
