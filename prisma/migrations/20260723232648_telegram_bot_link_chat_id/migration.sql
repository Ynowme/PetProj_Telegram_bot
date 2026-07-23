-- AlterTable
ALTER TABLE "TelegramBotLinkToken" ADD COLUMN     "telegramChatId" TEXT;

-- CreateIndex
CREATE INDEX "TelegramBotLinkToken_telegramChatId_idx" ON "TelegramBotLinkToken"("telegramChatId");
