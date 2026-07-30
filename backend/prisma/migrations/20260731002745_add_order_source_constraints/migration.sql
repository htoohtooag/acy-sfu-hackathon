ALTER TABLE "Order"
ADD CONSTRAINT "orders_exactly_one_source_check"
CHECK (("package_id" IS NOT NULL) <> ("job_post_id" IS NOT NULL));

ALTER TABLE "Order"
ADD CONSTRAINT "orders_source_type_matches_source_check"
CHECK (
  ("source_type" = 'PACKAGE' AND "package_id" IS NOT NULL AND "job_post_id" IS NULL)
  OR
  ("source_type" = 'CUSTOM_OFFER' AND "package_id" IS NULL AND "job_post_id" IS NOT NULL)
);
