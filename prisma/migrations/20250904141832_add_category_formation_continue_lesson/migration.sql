-- CreateTable
CREATE TABLE `Category` (
    `categoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormationContinue` (
    `formationContinueId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `competence` VARCHAR(191) NOT NULL,
    `dureeHeure` INTEGER NOT NULL,
    `note` DECIMAL(3, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormationContinue_categoryId_idx`(`categoryId`),
    INDEX `FormationContinue_name_idx`(`name`),
    PRIMARY KEY (`formationContinueId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `lessonId` INTEGER NOT NULL AUTO_INCREMENT,
    `formationContinueId` INTEGER NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fichierUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Lesson_formationContinueId_idx`(`formationContinueId`),
    PRIMARY KEY (`lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FormationContinue` ADD CONSTRAINT `FormationContinue_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`categoryId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_formationContinueId_fkey` FOREIGN KEY (`formationContinueId`) REFERENCES `FormationContinue`(`formationContinueId`) ON DELETE RESTRICT ON UPDATE CASCADE;
