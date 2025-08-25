-- CreateTable
CREATE TABLE `Suivi` (
    `suiviId` INTEGER NOT NULL AUTO_INCREMENT,
    `patientId` INTEGER NOT NULL,
    `nomMedicament` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NULL,
    `frequence` VARCHAR(191) NULL,
    `heure` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `stock` INTEGER NULL,
    `isTaken` BOOLEAN NOT NULL DEFAULT false,
    `ordonanceId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Suivi_patientId_date_isTaken_idx`(`patientId`, `date`, `isTaken`),
    UNIQUE INDEX `Suivi_patientId_date_heure_nomMedicament_key`(`patientId`, `date`, `heure`, `nomMedicament`),
    PRIMARY KEY (`suiviId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Suivi` ADD CONSTRAINT `Suivi_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suivi` ADD CONSTRAINT `Suivi_ordonanceId_fkey` FOREIGN KEY (`ordonanceId`) REFERENCES `Ordonance`(`ordonanceId`) ON DELETE SET NULL ON UPDATE CASCADE;
