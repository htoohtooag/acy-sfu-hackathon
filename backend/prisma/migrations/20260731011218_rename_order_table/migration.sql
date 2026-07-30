-- Preserve the existing Order data and relations while matching the Prisma @@map("orders") declaration.
ALTER TABLE "Order" RENAME TO "orders";
