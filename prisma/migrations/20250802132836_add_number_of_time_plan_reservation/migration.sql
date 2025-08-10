/*
  Warnings:

  - A unique constraint covering the columns `[reservationId]` on the table `Ordonance` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numberOfTimePlanReservation` to the `Abonnement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reservationId` to the `Ordonance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultationDuration` to the `Speciality` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Abonnement` ADD COLUMN `numberOfTimePlanReservation` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Ordonance` ADD COLUMN `reservationId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Reservation` MODIFY `date` VARCHAR(191) NOT NULL,
    MODIFY `hour` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Speciality` ADD COLUMN `consultationDuration` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Ordonance_reservationId_key` ON `Ordonance`(`reservationId`);

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`reservationId`) ON DELETE RESTRICT ON UPDATE CASCADE;
