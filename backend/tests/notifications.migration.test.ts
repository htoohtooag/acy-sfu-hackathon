import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migrationPath = new URL(
  '../prisma/migrations/20260807175023_add_notification_category_and_unread_index/migration.sql',
  import.meta.url,
);
const migrationSql = readFileSync(migrationPath, 'utf8');

test('notification migration preserves known categories and rejects unknown legacy values', () => {
  assert.match(migrationSql, /CREATE TYPE "notification_category" AS ENUM/);
  assert.match(migrationSql, /UPDATE "notifications"/);
  assert.match(migrationSql, /WHEN 'SYSTEM_ACCOUNT'/);
  assert.match(migrationSql, /WHEN 'ORDERS_ESCROW'/);
  assert.match(migrationSql, /WHEN 'OFFERS_PROPOSALS'/);
  assert.match(migrationSql, /unknown legacy notification category exists/);
  assert.match(migrationSql, /ALTER TABLE "notifications" DROP COLUMN "type"/);
});

test('notification migration creates the partial unread index', () => {
  assert.match(
    migrationSql,
    /CREATE INDEX "idx_notifications_unread"[\s\S]*ON "notifications"\("user_id"\)[\s\S]*WHERE "is_read" = false/,
  );
});
