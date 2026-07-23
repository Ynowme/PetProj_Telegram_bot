# API Contracts: Система ролей гостя Member / Gold Member

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

**Статус**: Реализовано (Промты 3, минимальный срез 4, 6) на fake POS-провайдере и реальном bot-адаптере (`/api/webhooks/telegram-bot/update`, `lib/telegram-bot-client.ts`) — см. `lib/pos/`, `lib/telegram-bot-link.ts`. Реальный `SkyServiceProvider` ещё не сделан (нужна официальная документация SkyService); Telegram-бот нужно один раз создать у @BotFather и зарегистрировать webhook через `npm run telegram:set-webhook`.

Легенда: 🔒 — требует сессию Auth.js; 🔒👑 — требует сессию + `isAdmin`; 🔏 — требует проверку подписи webhook (`X-Webhook-Signature`, HMAC-SHA256) вместо cookie-сессии.

## Привязка к столу (User Story 1, FR-003…FR-006, FR-017)

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| POST | `/api/account/table-session` | Гость запрашивает привязку по `tableCode`; сервер проверяет открытый стол в POS (`PosProvider.isTableOpen`) и создаёт `TableSession` в статусе `PENDING_STAFF_CONFIRMATION`, либо `409 { code: "ALREADY_LINKED" }`, если `tableCode` уже активен у другого гостя | 🔒 |
| GET | `/api/account/table-session` | Текущий (последний) статус привязки гостя — `NONE`/`PENDING_STAFF_CONFIRMATION`/`CONFIRMED`/`REJECTED`/`CLOSED` | 🔒 |
| GET | `/api/admin/table-sessions` | Список запросов, ожидающих подтверждения сотрудника (всегда только `PENDING_STAFF_CONFIRMATION`) | 🔒👑 |
| POST | `/api/admin/table-sessions/[id]/confirm` | Сотрудник подтверждает привязку — сервер повторно проверяет, что стол всё ещё открыт в POS, прежде чем перевести в `CONFIRMED` (защита от TOCTOU) | 🔒👑 |
| POST | `/api/admin/table-sessions/[id]/reject` | Сотрудник отклоняет запрос | 🔒👑 |

Ошибки: `tableCode`, не соответствующий ни одному открытому столу в POS → `404 { code: "TABLE_NOT_OPEN" }`.

## Импорт чеков из POS (User Story 1—2, FR-014, FR-015)

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| POST | `/api/webhooks/pos/receipt` | `{ event: "RECEIPT_CONFIRMED", posExternalId, tableSessionId, date, totalAmount, items }` — новый чек по подтверждённой сессии стола; `{ event: "RECEIPT_REFUNDED", posExternalId }` — возврат/отмена. `posExternalId` — ключ идемпотентности | 🔏 |
| POST | `/api/webhooks/pos/table-closed` | `{ tableCode }` — закрытие стола, переводит соответствующий `TableSession` в `CLOSED` | 🔏 |

Обе ручки: неверная/отсутствующая подпись → `401` без разбора тела; повторная доставка того же `posExternalId`/события стола → успешный ответ без побочных эффектов (идемпотентно), не дубликат.

## Личный кабинет: чеки, роль, cashback (User Story 1—2, расширяет `/api/account/receipts` из 001)

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| GET | `/api/account/receipts` | Без изменений контракта из 001 — включает и `MANUAL_ADMIN`, и `POS_IMPORT` чеки гостя вперемешку | 🔒 |
| GET | `/api/account/receipts/[id]` | Без изменений контракта из 001: доступ только если `Receipt.userId == session.user.id`, иначе `404` (анти-энумерация, как и раньше в 001) | 🔒 |
| GET | `/api/account/role` | Текущая роль; для Gold — `goldSinceMonth`; для Member — `confirmedReceiptsThisMonth`/`receiptsUntilGold` | 🔒 |
| GET | `/api/account/bonuses` | Без изменений контракта из 001 (баланс + история из `BonusTransaction`) — включает записи `type: "REVERSAL"` | 🔒 |

## Telegram-бот: доступ для Gold Member (User Story 3, FR-010…FR-012, FR-027)

| Метод | Путь | Назначение | Auth |
|---|---|---|---|
| GET | `/api/account/telegram-bot` | Статус привязки: `linked`, `linkedAt`, `phoneVerified`, `isGoldMember`, `hasPhone` | 🔒 |
| DELETE | `/api/account/telegram-bot` | Отвязка бота (FR-027); `409 { code: "NOT_LINKED" }`, если бот не был привязан | 🔒 |
| POST | `/api/account/telegram-bot/link-token` | Выдаёт одноразовый deep link токен. `403 { code: "PHONE_NOT_SET" }`, если телефон не указан; `403 { code: "NOT_GOLD_MEMBER" }`, если роль не Gold | 🔒 |
| POST | `/api/webhooks/telegram-bot/confirm-contact` | `{ rawToken, telegramUserId, phone }` — внутренний контракт (fake-транспорт и тесты). Сверяет токен, номер и (если уже был установлен при входе) Telegram id гостя; первое успешное подтверждение помечает телефон подтверждённым | 🔏 |
| POST | `/api/webhooks/telegram-bot/update` | Реальный webhook апдейтов Telegram Bot API: `/start <rawToken>` привязывает `chat_id`, `message.contact` подтверждает привязку тем же кодом, что и `confirm-contact` | 🔑 |

Легенда для этой таблицы: 🔑 — секрет-заголовок `X-Telegram-Bot-Api-Secret-Token` (эхо от Telegram, не HMAC), сверяется с `TELEGRAM_BOT_UPDATE_SECRET`, заданным при `setWebhook`.

Ошибки: истёкший/использованный токен → `410 { code: "TOKEN_EXPIRED_OR_USED" }` (в `update` — то же сообщением боту, не HTTP-кодом, т.к. Telegram ожидает `200`); несовпадение номера или Telegram id → единая `401 { code: "LINK_FAILED" }` без уточнения, что именно не совпало (анти-энумерация). В `update` дополнительно: `contact.user_id != from.id` (пересланный чужой контакт) → отдельное сообщение боту с повторным запросом собственного номера, без подтверждения.

## Будущее — не реализуется в этой фиче (FR-016)

`POST /api/account/receipts/[id]/pay` и всё, что связано с Google Pay/Apple Pay через Monobank — намеренно отсутствует в этом контракте. Кабинет показывает статический disabled-статус без обращения к какому-либо платёжному API.
