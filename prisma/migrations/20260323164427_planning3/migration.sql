/*
  Warnings:

  - You are about to drop the column `dimanche` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `isClosed` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `jeudi` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `lundi` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `mardi` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `mercredi` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `samedi` on the `planning` table. All the data in the column will be lost.
  - You are about to drop the column `vendredi` on the `planning` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[medecinId,jour,debutHour,type,hopitalId]` on the table `Planning` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jour` to the `Planning` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `planning` DROP COLUMN `dimanche`,
    DROP COLUMN `isClosed`,
    DROP COLUMN `jeudi`,
    DROP COLUMN `lundi`,
    DROP COLUMN `mardi`,
    DROP COLUMN `mercredi`,
    DROP COLUMN `samedi`,
    DROP COLUMN `vendredi`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isOff` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `jour` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `Planning_medecinId_jour_isActive_idx` ON `Planning`(`medecinId`, `jour`, `isActive`);

-- CreateIndex
CREATE UNIQUE INDEX `Planning_medecinId_jour_debutHour_type_hopitalId_key` ON `Planning`(`medecinId`, `jour`, `debutHour`, `type`, `hopitalId`);
