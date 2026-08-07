-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('SYSTEM_ACCOUNT', 'ORDERS_ESCROW', 'OFFERS_PROPOSALS');

-- Add the typed category before removing the legacy string column so existing rows can be preserved.
ALTER TABLE "notifications" ADD COLUMN "category" "notification_category";

-- Convert only the categories defined by the application. Unknown legacy values abort this migration.
UPDATE "notifications"
SET "category" = CASE UPPER("type")
  WHEN 'SYSTEM_ACCOUNT' THEN 'SYSTEM_ACCOUNT'::"notification_category"
  WHEN 'ORDERS_ESCROW' THEN 'ORDERS_ESCROW'::"notification_category"
  WHEN 'OFFERS_PROPOSALS' THEN 'OFFERS_PROPOSALS'::"notification_category"
  ELSE NULL
END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "notifications" WHERE "category" IS NULL) THEN
    RAISE EXCEPTION 'Cannot convert notifications.type: an unknown legacy notification category exists.';
  END IF;
END $$;

ALTER TABLE "notifications" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "notifications" DROP COLUMN "type";

-- Keep only unread rows in the badge count index.
CREATE INDEX "idx_notifications_unread"
ON "notifications"("user_id")
WHERE "is_read" = false;
