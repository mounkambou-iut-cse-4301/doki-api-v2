/*
  Warnings:

  - You are about to drop the column `date` on the `Suivi` table. All the data in the column will be lost.
  - You are about to drop the column `frequence` on the `Suivi` table. All the data in the column will be lost.
  - You are about to drop the column `heure` on the `Suivi` table. All the data in the column will be lost.
  - You are about to drop the column `isTaken` on the `Suivi` table. All the data in the column will be lost.
  - You are about to drop the column `nomMedicament` on the `Suivi` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Suivi` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Suivi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `frequency` to the `Suivi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Suivi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notificationTimes` to the `Suivi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Suivi` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Suivi` DROP FOREIGN KEY `Suivi_patientId_fkey`;

-- DropIndex
DROP INDEX `Suivi_patientId_date_heure_nomMedicament_key` ON `Suivi`;

-- DropIndex
DROP INDEX `Suivi_patientId_date_isTaken_idx` ON `Suivi`;

-- AlterTable
ALTER TABLE `CategoryVideo` ADD COLUMN `coverImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Suivi` DROP COLUMN `date`,
    DROP COLUMN `frequence`,
    DROP COLUMN `heure`,
    DROP COLUMN `isTaken`,
    DROP COLUMN `nomMedicament`,
    DROP COLUMN `stock`,
    ADD COLUMN `endDate` DATETIME(3) NOT NULL,
    ADD COLUMN `forme` VARCHAR(191) NULL,
    ADD COLUMN `frequency` JSON NOT NULL,
    ADD COLUMN `instructions` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `notificationTimes` JSON NOT NULL,
    ADD COLUMN `posologie` VARCHAR(191) NULL,
    ADD COLUMN `startDate` DATETIME(3) NOT NULL,
    ADD COLUMN `voie` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_newReservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`reservationId`) ON DELETE RESTRICT ON UPDATE CASCADE;
