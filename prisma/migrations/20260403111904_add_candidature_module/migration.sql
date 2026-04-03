-- CreateTable
CREATE TABLE `Candidature` (
    `candidatureId` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `file` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `medecinId` INTEGER NOT NULL,
    `hopitalId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Candidature_medecinId_fkey`(`medecinId`),
    INDEX `Candidature_hopitalId_fkey`(`hopitalId`),
    INDEX `Candidature_status_idx`(`status`),
    INDEX `Candidature_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`candidatureId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Candidature` ADD CONSTRAINT `Candidature_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Candidature` ADD CONSTRAINT `Candidature_hopitalId_fkey` FOREIGN KEY (`hopitalId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
