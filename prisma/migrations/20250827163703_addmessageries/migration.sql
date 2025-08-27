-- CreateTable
CREATE TABLE `Conversation` (
    `conversationId` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversation_medecinId_idx`(`medecinId`),
    INDEX `Conversation_patientId_idx`(`patientId`),
    UNIQUE INDEX `Conversation_medecinId_patientId_key`(`medecinId`, `patientId`),
    PRIMARY KEY (`conversationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `messageId` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `type` ENUM('TEXT', 'FORM_INTAKE') NOT NULL,
    `content` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Message_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `Message_receiverId_isRead_idx`(`receiverId`, `isRead`),
    PRIMARY KEY (`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`conversationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;
