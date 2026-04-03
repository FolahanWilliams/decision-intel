-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "emailForwardToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_emailForwardToken_key" ON "UserSettings"("emailForwardToken");
