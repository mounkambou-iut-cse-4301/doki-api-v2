/*
  Warnings:

  - You are about to drop the `_CategoryVideoToVideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_CategoryVideoToVideo` DROP FOREIGN KEY `_CategoryVideoToVideo_A_fkey`;

-- DropForeignKey
ALTER TABLE `_CategoryVideoToVideo` DROP FOREIGN KEY `_CategoryVideoToVideo_B_fkey`;

-- DropTable
DROP TABLE `_CategoryVideoToVideo`;

-- AddForeignKey
ALTER TABLE `Video` ADD CONSTRAINT `Video_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `CategoryVideo`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;
