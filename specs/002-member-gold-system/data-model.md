# Data Model: Система ролей гостя Member / Gold Member

**Feature**: [spec.md](./spec.md) | **Date**: 2026-07-23

**Статус**: Реализовано и применено к `prisma/schema.prisma` (миграции `20260723150000_member_gold_system`, `20260724090000_telegram_bot_link`). Ниже — фактическая схема, дополненная полями `User.telegramBotLinkedAt` и значениями `AuditAction.BOT_LINKED`/`BOT_UNLINKED`, добавленными при реализации Промта 6.

Модель расширяет существующую схему из specs/001-bar-menu-account там, где это возможно (`User`, `Receipt`, `BonusTransaction`), вместо создания параллельных сущностей — эти таблицы уже покрывают большую часть требований.

## Расширение User

```prisma
enum GuestRole {
  MEMBER
  GOLD_MEMBER
}

model User {
  // ...существующие поля без изменений...
  role                GuestRole @default(MEMBER)
  goldSinceMonth       String?   // "2026-07" — месяц, в котором присвоен Gold (для аудита правила)
  phoneVerifiedAt      DateTime? // уже есть в схеме, но сейчас нигде не проставляется — эта фича начинает его использовать
}
```

**Правила**:
- `role` по умолчанию `MEMBER` для каждого нового пользователя (FR-001) — безопасное значение по умолчанию, никогда не выставляется клиентом напрямую.
- `role` меняется только серверным job'ом, который считает подтверждённые чеки за календарный месяц (FR-007) — никакого API для прямого изменения роли не существует (FR-018, решено — «никто в MVP»).
- `phoneVerifiedAt` — существующее, но неиспользуемое поле; эта фича добавляет единственный писатель — подтверждение номера через `POST /api/account/phone` (уже есть, FR-026 из 001) плюс отдельный шаг верификации, который здесь не проектируется заново (см. Open follow-up ниже).

**Индексы**: `role` — обычный (не уникальный) индекс, так как запросы «все Gold Member» нужны для отчётности/рассылок.

## TableSession (новая сущность)

```prisma
enum TableSessionStatus {
  PENDING_STAFF_CONFIRMATION
  CONFIRMED
  REJECTED
  CLOSED
}

model TableSession {
  id                    String   @id @default(cuid())
  tableCode             String   // публичный код стола из QR, НЕ уникален сам по себе — уникальность только вместе со статусом open
  userId                String
  status                TableSessionStatus @default(PENDING_STAFF_CONFIRMATION)
  posTableExternalId    String?  // ID открытого стола в SkyService на момент проверки
  requestedAt           DateTime @default(now())
  confirmedAt           DateTime?
  confirmedByStaffId    String?  // User.id сотрудника (isAdmin) — не обязательно тот же admin, что владелец
  closedAt              DateTime?

  user           User      @relation(fields: [userId], references: [id])
  confirmedBy    User?     @relation("TableSessionConfirmedBy", fields: [confirmedByStaffId], references: [id])
  receipts       Receipt[]

  @@index([tableCode, status])
  @@index([userId])
}
```

**Правила**:
- Один гость на стол (FR-017, решено) — уникальность обеспечивается на уровне бизнес-логики: перед созданием новой записи со статусом `PENDING_STAFF_CONFIRMATION`/`CONFIRMED` для данного `tableCode` система проверяет, что нет другой активной (не `CLOSED`/`REJECTED`) записи для этого же `tableCode`; частичный уникальный индекс `@@unique([tableCode]) WHERE status IN ('PENDING_STAFF_CONFIRMATION','CONFIRMED')` — на Postgres такое ограничение пишется через `CREATE UNIQUE INDEX ... WHERE status = ...` вручную в SQL миграции, Prisma-схема сама такое не выражает.
- `posTableExternalId` заполняется на этапе создания запроса — сервер обязан заново запросить у `PosProvider`, что стол всё ещё открыт, непосредственно перед подтверждением сотрудником (защита от TOCTOU: стол мог закрыться между запросом гостя и подтверждением официанта).
- Закрытие (`CLOSED`) необратимо: новые чеки к закрытой сессии не привязываются, новые привязки к тому же `tableCode` создают новую независимую запись `TableSession`.
- **Retention**: хранится бессрочно как часть истории посещений — данных о столе (номер/код) недостаточно для идентификации личности без связки с `User`, поэтому отдельная политика хранения не требуется сверх политики самого `User`.

## Receipt (расширение существующей модели)

```prisma
enum ReceiptSource {
  MANUAL_ADMIN   // существующий способ из 001-bar-menu-account, продолжает работать
  POS_IMPORT
}

enum ReceiptStatus {
  CONFIRMED
  REFUNDED       // полный возврат — сторно-запись в BonusTransaction (FR-008)
  CANCELLED      // отменён в POS до оплаты — не учитывается нигде
}

model Receipt {
  // ...существующие поля без изменений...
  source              ReceiptSource @default(MANUAL_ADMIN)
  status               ReceiptStatus @default(CONFIRMED)
  posExternalId         String?       @unique  // idempotency key для импорта из POS (FR-015)
  tableSessionId        String?
  countsTowardGoldMonth String?       // "2026-07", если чек учтён в подсчёте Gold; null для нулевых/отрицательных/отменённых чеков

  tableSession TableSession? @relation(fields: [tableSessionId], references: [id])
}
```

**Правила**:
- `posExternalId` с `@unique` — единственный механизм идемпотентности импорта: повторная доставка того же события от POS обрабатывается как `upsert` по этому полю, а не создаёт дубликат (FR-015, SC-006).
- Чек с суммой ≤ 0 (сторно/служебная запись POS) импортируется, но `countsTowardGoldMonth` остаётся `null` — не учитывается в счётчике для Gold и не порождает запись в cashback-ledger (Edge Case из spec.md).
- `MANUAL_ADMIN` чеки (существующий инструмент `/admin/receipts/new`) продолжают создаваться без `posExternalId`/`tableSessionId` — если владелец захочет, чтобы ручные чеки тоже учитывались в Gold-подсчёте, это отдельное решение вне этой фичи (см. Assumptions в spec.md).
- Возврат/отмена меняет `status`, не удаляет и не изменяет исходные `ReceiptItem` — фактическая история заказа сохраняется, а cashback корректируется отдельной ledger-записью (см. ниже).

## Cashback-ledger — переиспользование BonusTransaction

Отдельная новая таблица не нужна: существующая `BonusTransaction` (userId, amount, reason, receiptId, createdAt) уже является неизменяемым ledger'ом — ровно то, что требует FR-008. Расширение:

```prisma
model BonusTransaction {
  // ...существующие поля без изменений...
  type String @default("ACCRUAL") // "ACCRUAL" | "REVERSAL" — вместо свободного текста в reason
}
```

**Правила**:
- Начисление Gold cashback создаёт запись `type: "ACCRUAL"`, `amount: +3% от Receipt.totalAmount`, `receiptId` указывает на исходный чек.
- Возврат/отмена чека (Receipt.status → REFUNDED) создаёт отдельную запись `type: "REVERSAL"`, `amount: -(сумма исходного начисления)`, тот же `receiptId` — полная сторно-запись без пропорционального пересчёта (решено 2026-07-23).
- Баланс гостя как в 001-bar-menu-account — просто `SUM(amount)` по всем записям пользователя; отдельного поля-кэша баланса не заводим (SC-004 требует, чтобы баланс всегда точно равнялся сумме ledger).
- Уникальность: `@@unique([receiptId, type])` — не даёт дважды начислить cashback за один и тот же чек и не даёт дважды сторнировать один и тот же возврат при повторной доставке события (дополнительная идемпотентность поверх `Receipt.posExternalId`).

## TelegramBotLinkToken (новая сущность)

```prisma
model TelegramBotLinkToken {
  id             String    @id @default(cuid())
  userId         String
  tokenHash      String    @unique // хранится только хеш, не сырой токен (сам токен — только в URL, одноразово)
  telegramChatId String?           // (добавлено 2026-07-24) chat_id, привязанный на /start реального бота — мост
                                    // между апдейтом /start (есть сырой токен) и апдейтом с contact (только chat_id)
  expiresAt      DateTime           // createdAt + 10 минут
  usedAt         DateTime?
  createdAt      DateTime  @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([telegramChatId])
}
```

**Правила**:
- Выдаётся только `User.role == GOLD_MEMBER && phoneVerifiedAt != null` (FR-010) — проверка на сервере при выдаче, не только в UI.
- `tokenHash` — SHA-256 сырого токена (та же техника, что уже используется для токена входа в `lib/telegram-login.ts`); сырой токен никогда не попадает в БД, только в одноразовую ссылку.
- Одноразовость: `usedAt` проставляется атомарно при первом успешном использовании; повторное использование отклоняется (FR-011).
- **Retention/угроза конфиденциальности**: истёкшие и использованные токены можно удалять периодической job'ой (например, раз в сутки) — хранить их бессрочно нет смысла и увеличивает поверхность в случае утечки БД. Номер телефона в этой таблице не хранится и не должен появиться (FR-011 — телефон не передаётся в URL/сообщениях).

## AuditLogEntry (новая сущность)

```prisma
enum AuditAction {
  ROLE_CHANGED
  PHONE_VERIFIED
  TABLE_SESSION_CONFIRMED
  TABLE_SESSION_REJECTED
  CASHBACK_REVERSED
}

model AuditLogEntry {
  id         String      @id @default(cuid())
  action     AuditAction
  targetUserId String
  actor      String      // "SYSTEM" | "POS_EVENT" | User.id сотрудника, подтвердившего действие
  metadata   Json?        // например, { "receiptId": "...", "month": "2026-07", "confirmedCount": 7 }
  createdAt  DateTime    @default(now())

  targetUser User @relation(fields: [targetUserId], references: [id])

  @@index([targetUserId])
  @@index([action])
}
```

**Правила**:
- Пишется при: автоматическом присвоении Gold (FR-007/FR-013), подтверждении/отклонении привязки к столу сотрудником, подтверждении телефона, сторно cashback.
- `metadata` — JSON, не структурированные колонки: разные типы событий имеют разный набор полезной нагрузки, а строгая типизация каждого варианта избыточна для audit-лога, который читается людьми, а не бизнес-логикой.
- **Не хранить**: номера телефонов, токены, содержимое webhook-подписей — только идентификаторы и агрегированные факты (FR по угрозам из Промта 2 docs/claude-member-system-prompts.md).

## Диаграмма связей (текстовая)

```text
User 1---N TableSession (как гость)
User 1---N TableSession (как confirmedBy — сотрудник)
User 1---N TelegramBotLinkToken
User 1---N AuditLogEntry (как targetUser)
TableSession 1---N Receipt
Receipt 1---N ReceiptItem (без изменений из 001)
Receipt 1---N BonusTransaction (без изменений из 001, теперь дополнительно type ACCRUAL/REVERSAL)
```

## Что намеренно не хранится (угрозы конфиденциальности)

- Данные банковских карт, токены Apple Pay/Google Pay — вне скоупа этой фичи (оплата не реализуется).
- Открытые SMS-коды — в проекте больше нет SMS-механизма (email/пароль/SMS-восстановление удалены в предыдущей задаче).
- Сырые токены Telegram-бота (`TELEGRAM_BOT_TOKEN`) — уже не хранятся в БД, только в secret manager.
- Номер телефона гостя — нигде, кроме `User.phone`, не дублируется (ни в `TelegramBotLinkToken`, ни в `AuditLogEntry.metadata`, ни в URL deep link).

## SQL/Prisma migration plan (для Промта 3, не выполнять сейчас)

1. `ALTER TYPE`/новый enum `GuestRole`, добавить `User.role` (default `MEMBER`), `User.goldSinceMonth`.
2. Создать `TableSession` + enum `TableSessionStatus`; частичный уникальный индекс на `(tableCode)` через raw SQL в migration.sql (Prisma-схема этого не выражает).
3. Расширить `Receipt`: `source`, `status` (enum'ы), `posExternalId` (unique), `tableSessionId` (FK), `countsTowardGoldMonth`.
4. Расширить `BonusTransaction`: `type` (строка/enum) + `@@unique([receiptId, type])`.
5. Создать `TelegramBotLinkToken` (2026-07-24: добавлено поле `telegramChatId` отдельной миграцией `20260723232648_telegram_bot_link_chat_id` для реального бот-адаптера).
6. Создать `AuditLogEntry` + enum `AuditAction`.
7. Backfill: у существующих `Receipt` без `source` проставить `MANUAL_ADMIN` (соответствует текущему единственному способу создания чеков); `BonusTransaction.type` backfill в `"ACCRUAL"` для всех существующих записей.
8. Откат: миграция обратима стандартным способом (все новые поля nullable/с default, кроме `posExternalId unique`, который на существующих строках останется `null`, что допустимо для nullable-unique в Postgres — несколько `null` не конфликтуют с уникальностью).
