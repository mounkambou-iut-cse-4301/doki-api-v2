/*
  Warnings:

  - You are about to drop the column `category` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Video` DROP COLUMN `category`,
    ADD COLUMN `categoryId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Video_categoryId_idx` ON `Video`(`categoryId`);

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `Video_medecinId_idx` ON `Video`(`medecinId`);
DROP INDEX `Video_medecinId_fkey` ON `Video`;
