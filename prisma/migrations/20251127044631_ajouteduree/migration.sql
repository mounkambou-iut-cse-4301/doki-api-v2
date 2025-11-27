-- DropForeignKey
ALTER TABLE `Ordonance` DROP FOREIGN KEY `Ordonance_newReservationId_fkey`;

-- AlterTable
ALTER TABLE `Video` ADD COLUMN `duree` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`reservationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suivi` ADD CONSTRAINT `Suivi_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
