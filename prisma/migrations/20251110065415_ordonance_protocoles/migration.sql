-- AlterTable
ALTER TABLE `Ordonance` ADD COLUMN `name` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `ProtocoleOrdonance` (
    `protocoleId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(500) NULL,
    `traitement` JSON NOT NULL,
    `images` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProtocoleOrdonance_name_key`(`name`),
    PRIMARY KEY (`protocoleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
