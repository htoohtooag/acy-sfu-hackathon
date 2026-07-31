-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_id_reviewer_id_key" ON "reviews"("order_id", "reviewer_id");
