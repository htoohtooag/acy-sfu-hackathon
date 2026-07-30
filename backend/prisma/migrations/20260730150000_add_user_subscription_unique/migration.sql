-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_user_id_plan_id_key" ON "user_subscriptions"("user_id", "plan_id");
