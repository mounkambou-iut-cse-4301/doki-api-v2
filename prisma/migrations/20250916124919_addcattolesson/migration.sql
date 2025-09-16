-- DropForeignKey
ALTER TABLE `formations_continue` DROP FOREIGN KEY `formations_continue_categoryId_fkey`;

-- AlterTable
ALTER TABLE `formations_continue` MODIFY `categoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `lessons` ADD COLUMN `categoryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `formations_continue` ADD CONSTRAINT `formations_continue_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`categoryId`) ON DELETE SET NULL ON UPDATE CASCADE;
