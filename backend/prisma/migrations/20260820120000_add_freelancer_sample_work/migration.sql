CREATE TABLE "freelancer_sample_works" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "freelancer_id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "image_path" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "freelancer_sample_works_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "idx_freelancer_sample_work_freelancer" ON "freelancer_sample_works"("freelancer_id");
CREATE UNIQUE INDEX "uq_freelancer_sample_work_order" ON "freelancer_sample_works"("freelancer_id", "sort_order");

ALTER TABLE "freelancer_sample_works"
ADD CONSTRAINT "freelancer_sample_works_freelancer_id_fkey"
FOREIGN KEY ("freelancer_id") REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
