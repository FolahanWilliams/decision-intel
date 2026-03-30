-- AlterTable
ALTER TABLE "SlackInstallation" ADD COLUMN "monitoredChannels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SlackInstallation" ADD COLUMN "nudgeFrequency" TEXT NOT NULL DEFAULT 'normal';
