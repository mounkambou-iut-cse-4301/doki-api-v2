-- CreateTable
CREATE TABLE `User` (
    `userId` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `userType` ENUM('PATIENT', 'MEDECIN', 'ADMIN', 'SUPERADMIN', 'HOPITAL') NOT NULL,
    `acceptPrivacy` BOOLEAN NOT NULL DEFAULT false,
    `specialityId` INTEGER NULL,
    `city` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `addressHosp` VARCHAR(191) NULL,
    `hospitalName` VARCHAR(191) NULL,
    `longitude` DECIMAL(10, 8) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `profile` VARCHAR(191) NULL,
    `weight` DECIMAL(5, 2) NULL,
    `matricule` VARCHAR(191) NULL,
    `expotoken` VARCHAR(255) NULL,
    `isBlock` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`phone`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedecinHopital` (
    `medecinId` INTEGER NOT NULL,
    `hopitalId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`medecinId`, `hopitalId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GroupePackage` (
    `packageId` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `specialityId` INTEGER NOT NULL,
    `nombreConsultations` INTEGER NOT NULL,
    `chatInclus` BOOLEAN NOT NULL DEFAULT false,
    `appelInclus` BOOLEAN NOT NULL DEFAULT false,
    `prix` DECIMAL(10, 2) NOT NULL,
    `dureeValiditeJours` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GroupePackage_specialityId_isActive_idx`(`specialityId`, `isActive`),
    PRIMARY KEY (`packageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Abonnement` (
    `abonnementId` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NULL,
    `patientId` INTEGER NOT NULL,
    `packageId` INTEGER NULL,
    `numberOfTimePlanReservation` INTEGER NULL,
    `status` ENUM('PENDING', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
    `debutDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `transactionId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`abonnementId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Planning` (
    `planningId` INTEGER NOT NULL AUTO_INCREMENT,
    `debutHour` VARCHAR(191) NOT NULL,
    `endHour` VARCHAR(191) NOT NULL,
    `lundi` BOOLEAN NOT NULL DEFAULT false,
    `mardi` BOOLEAN NOT NULL DEFAULT false,
    `mercredi` BOOLEAN NOT NULL DEFAULT false,
    `jeudi` BOOLEAN NOT NULL DEFAULT false,
    `vendredi` BOOLEAN NOT NULL DEFAULT false,
    `samedi` BOOLEAN NOT NULL DEFAULT false,
    `dimanche` BOOLEAN NOT NULL DEFAULT false,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `medecinId` INTEGER NOT NULL,
    `type` ENUM('ONLINE', 'IN_PERSON') NOT NULL DEFAULT 'ONLINE',
    `hopitalId` INTEGER NULL,
    `salle` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`planningId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reservation` (
    `reservationId` INTEGER NOT NULL AUTO_INCREMENT,
    `date` VARCHAR(191) NOT NULL,
    `hour` VARCHAR(191) NOT NULL,
    `type` ENUM('CALL', 'IN_PERSON') NOT NULL,
    `patientName` VARCHAR(191) NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `age` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `location` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NULL,
    `transactionId` INTEGER NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `hopitalId` INTEGER NULL,
    `abonnementId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`reservationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Publicite` (
    `publiciteId` INTEGER NOT NULL AUTO_INCREMENT,
    `annonceurType` ENUM('MEDECIN', 'HOPITAL') NOT NULL,
    `annonceurId` INTEGER NOT NULL,
    `typeContenu` ENUM('VIDEO', 'IMAGE') NOT NULL,
    `urlContenu` VARCHAR(191) NOT NULL,
    `titre` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `statut` ENUM('PENDING_VALIDATION', 'ACTIVE', 'TERMINATED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VALIDATION',
    `montant` DECIMAL(10, 2) NOT NULL,
    `transactionId` INTEGER NULL,
    `adminValidatorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`publiciteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `transactionId` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `type` ENUM('RESERVATION', 'ABONNEMENT', 'PUBLICITE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`transactionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `conversationId` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Conversation_medecinId_patientId_key`(`medecinId`, `patientId`),
    PRIMARY KEY (`conversationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `messageId` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'FICHE_REQUEST', 'FICHE_RESPONSE') NOT NULL DEFAULT 'TEXT',
    `conversationId` INTEGER NULL,
    `casId` INTEGER NULL,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NULL,
    `content` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `ficheId` INTEGER NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isAnonymous` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`messageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CasDifficile` (
    `casId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `diseaseCode` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`casId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CasReadState` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `casId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lastReadAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CasReadState_casId_userId_key`(`casId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Fiche` (
    `ficheId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdBy` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `questions` JSON NOT NULL,
    `responses` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ficheId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `notificationId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`notificationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Speciality` (
    `specialityId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `consultationPrice` DECIMAL(10, 2) NOT NULL,
    `consultationDuration` INTEGER NOT NULL,
    `planMonthAmount` DECIMAL(10, 2) NOT NULL,
    `numberOfTimePlanReservation` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`specialityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `feedbackId` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `note` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`feedbackId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorite` (
    `favoriteId` INTEGER NOT NULL AUTO_INCREMENT,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`favoriteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Video` (
    `videoId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `categoryId` INTEGER NULL,
    `medecinId` INTEGER NOT NULL,
    `duree` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`videoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CategoryVideo` (
    `categoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `coverImage` VARCHAR(191) NULL,

    UNIQUE INDEX `CategoryVideo_name_key`(`name`),
    PRIMARY KEY (`categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SoldeMedecin` (
    `soldeMedecinId` INTEGER NOT NULL AUTO_INCREMENT,
    `solde` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `medecinId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`soldeMedecinId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ordonance` (
    `ordonanceId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `dureeTraitement` VARCHAR(100) NULL,
    `traitement` JSON NULL,
    `comment` VARCHAR(191) NULL,
    `medecinId` INTEGER NOT NULL,
    `patientId` INTEGER NOT NULL,
    `images` JSON NULL,
    `reservationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Ordonance_reservationId_key`(`reservationId`),
    PRIMARY KEY (`ordonanceId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Suivi` (
    `suiviId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `dosage` VARCHAR(191) NULL,
    `posologie` VARCHAR(191) NULL,
    `forme` VARCHAR(191) NULL,
    `voie` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `frequency` JSON NOT NULL,
    `notificationTimes` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `patientId` INTEGER NOT NULL,
    `ordonanceId` INTEGER NULL,

    PRIMARY KEY (`suiviId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordReset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `otpHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `categoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormationContinue` (
    `formationId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NULL,
    `competence` VARCHAR(191) NOT NULL,
    `dureeHeures` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`formationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lesson` (
    `lessonId` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `categoryId` INTEGER NULL,
    `fileUrl` VARCHAR(191) NULL,
    `orderIndex` INTEGER NULL,
    `formationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`lessonId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `roleId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `permissionId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Permission_name_key`(`name`),
    PRIMARY KEY (`permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medicament` (
    `medicamentId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `nameCommercial` VARCHAR(191) NULL,
    `nameLabo` VARCHAR(191) NULL,
    `dosage` VARCHAR(191) NULL,
    `forme` VARCHAR(191) NULL,
    `voie` VARCHAR(191) NULL,
    `posologie` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`medicamentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_specialityId_fkey` FOREIGN KEY (`specialityId`) REFERENCES `Speciality`(`specialityId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedecinHopital` ADD CONSTRAINT `MedecinHopital_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedecinHopital` ADD CONSTRAINT `MedecinHopital_hopitalId_fkey` FOREIGN KEY (`hopitalId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupePackage` ADD CONSTRAINT `GroupePackage_specialityId_fkey` FOREIGN KEY (`specialityId`) REFERENCES `Speciality`(`specialityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`transactionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Abonnement` ADD CONSTRAINT `Abonnement_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `GroupePackage`(`packageId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Planning` ADD CONSTRAINT `Planning_hopitalId_fkey` FOREIGN KEY (`hopitalId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`transactionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_hopitalId_fkey` FOREIGN KEY (`hopitalId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reservation` ADD CONSTRAINT `Reservation_abonnementId_fkey` FOREIGN KEY (`abonnementId`) REFERENCES `Abonnement`(`abonnementId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`transactionId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_adminValidatorId_fkey` FOREIGN KEY (`adminValidatorId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Publicite` ADD CONSTRAINT `Publicite_annonceurId_fkey` FOREIGN KEY (`annonceurId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_casId_fkey` FOREIGN KEY (`casId`) REFERENCES `CasDifficile`(`casId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`userId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `Fiche`(`ficheId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasDifficile` ADD CONSTRAINT `CasDifficile_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasReadState` ADD CONSTRAINT `CasReadState_casId_fkey` FOREIGN KEY (`casId`) REFERENCES `CasDifficile`(`casId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CasReadState` ADD CONSTRAINT `CasReadState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Fiche` ADD CONSTRAINT `Fiche_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedback` ADD CONSTRAINT `Feedback_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorite` ADD CONSTRAINT `Favorite_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `CategoryVideo`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SoldeMedecin` ADD CONSTRAINT `SoldeMedecin_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_medecinId_fkey` FOREIGN KEY (`medecinId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ordonance` ADD CONSTRAINT `Ordonance_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`reservationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suivi` ADD CONSTRAINT `Suivi_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Suivi` ADD CONSTRAINT `Suivi_ordonanceId_fkey` FOREIGN KEY (`ordonanceId`) REFERENCES `Ordonance`(`ordonanceId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PasswordReset` ADD CONSTRAINT `PasswordReset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormationContinue` ADD CONSTRAINT `FormationContinue_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_formationId_fkey` FOREIGN KEY (`formationId`) REFERENCES `FormationContinue`(`formationId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lesson` ADD CONSTRAINT `Lesson_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`roleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`permissionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`roleId`) ON DELETE RESTRICT ON UPDATE CASCADE;
