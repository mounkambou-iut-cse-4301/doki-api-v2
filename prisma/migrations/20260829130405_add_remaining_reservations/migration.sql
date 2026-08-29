-- AlterTable
ALTER TABLE `Abonnement` ADD COLUMN `remainingReservations` INTEGER NOT NULL DEFAULT 0;

-- Backfill remainingReservations for existing subscriptions
UPDATE `Abonnement` abo
LEFT JOIN (
	SELECT `abonnementId`, COUNT(*) AS cnt
	FROM `Reservation`
	WHERE `abonnementId` IS NOT NULL
	GROUP BY `abonnementId`
) r ON r.`abonnementId` = abo.`abonnementId`
SET abo.`remainingReservations` = GREATEST(
	0,
	COALESCE(abo.`numberOfTimePlanReservation`, 0) - COALESCE(r.cnt, 0)
);
