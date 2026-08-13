-- Той самий прийом, що CastaPOS PosOrder_single_open_per_table_key (окремий репозиторій,
-- migration 20260730120000): Prisma-схема не виражає частковий унікальний індекс, тому міграція
-- написана вручну. Без цього два майже одночасних виклики table-opened вебхука для одного столу
-- (напр. ретрай доставки CastaPOS) обидва пройшли б перевірку "чи є вже відкрите замовлення" і
-- створили б два окремих OPEN PosOrder на один стіл — isTableOpen/listTables
-- (lib/pos/shared-db-provider.ts) отримали б неоднозначний результат.
CREATE UNIQUE INDEX "PosOrder_single_open_per_table_key" ON "PosOrder" ("tableId") WHERE "status" = 'OPEN';
