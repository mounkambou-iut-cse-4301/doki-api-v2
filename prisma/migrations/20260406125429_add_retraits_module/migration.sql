-- CreateTable
CREATE TABLE `ParametreRetrait` (
    `parametreRetraitId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `numeroRetrait` VARCHAR(191) NOT NULL,
    `statut` ENUM('OTP_EN_ATTENTE', 'VERIFIE') NOT NULL DEFAULT 'OTP_EN_ATTENTE',
    `otpHash` VARCHAR(191) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `otpValidatedAt` DATETIME(3) NULL,
    `verifieAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ParametreRetrait_userId_key`(`userId`),
    UNIQUE INDEX `ParametreRetrait_numeroRetrait_key`(`numeroRetrait`),
    INDEX `ParametreRetrait_statut_idx`(`statut`),
    PRIMARY KEY (`parametreRetraitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Retrait` (
    `retraitId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `parametreRetraitId` INTEGER NOT NULL,
    `montant` DECIMAL(10, 2) NOT NULL,
    `statut` ENUM('OTP_EN_ATTENTE', 'PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OTP_EN_ATTENTE',
    `numeroRetraitSnapshot` VARCHAR(191) NOT NULL,
    `otpHash` VARCHAR(191) NULL,
    `otpExpiresAt` DATETIME(3) NULL,
    `otpValidatedAt` DATETIME(3) NULL,
    `referenceTraitementAdmin` VARCHAR(191) NULL,
    `motifAnnulation` VARCHAR(191) NULL,
    `demandeLe` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completeLe` DATETIME(3) NULL,
    `annuleLe` DATETIME(3) NULL,
    `completeParAdminId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Retrait_userId_idx`(`userId`),
    INDEX `Retrait_parametreRetraitId_idx`(`parametreRetraitId`),
    INDEX `Retrait_statut_idx`(`statut`),
    INDEX `Retrait_completeParAdminId_idx`(`completeParAdminId`),
    INDEX `Retrait_demandeLe_idx`(`demandeLe`),
    PRIMARY KEY (`retraitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ParametreRetrait` ADD CONSTRAINT `ParametreRetrait_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retrait` ADD CONSTRAINT `Retrait_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retrait` ADD CONSTRAINT `Retrait_completeParAdminId_fkey` FOREIGN KEY (`completeParAdminId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retrait` ADD CONSTRAINT `Retrait_parametreRetraitId_fkey` FOREIGN KEY (`parametreRetraitId`) REFERENCES `ParametreRetrait`(`parametreRetraitId`) ON DELETE RESTRICT ON UPDATE CASCADE;
