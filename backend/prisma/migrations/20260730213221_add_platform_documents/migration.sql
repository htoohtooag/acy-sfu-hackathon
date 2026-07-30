-- CreateTable
CREATE TABLE "platform_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_documents_title_key" ON "platform_documents"("title");

-- Keep platform documents backend-only. No public Data API policies are created.
ALTER TABLE "platform_documents" ENABLE ROW LEVEL SECURITY;
