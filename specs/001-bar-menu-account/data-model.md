# Data Model: Сайт бара с меню и клиентским кабинетом

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md) | **Date**: 2026-07-23

Модель рассчитана на PostgreSQL + Prisma (см. research.md, п.3). Управление контентом (меню, баннеры акций, чеки/бонусы) для v1 выполняется напрямую разработчиком/владельцем (seed-скрипты, Prisma Studio) — полноценный админ-интерфейс в спецификации не описан и должен планироваться отдельной фичей при необходимости.

## User (Пользователь / гость)

Соответствует Key Entity «Пользователь (гость)» в spec.md.

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| name | string | обязательно |
| email | string \| null | уникально, если задан; необязателен — Telegram его не предоставляет, гость может добавить вручную в профиле |
| phone | string \| null | уникально, если задан; запрашивается отдельным шагом после первого входа (FR-026) |
| telegramId | string \| null | уникально, если задан; ID из Telegram Login Widget (FR-004/FR-026), единственный способ входа |
| telegramUsername | string \| null | опциональный @username из Telegram, для отображения |
| isAdmin | bool | доступ к `/admin` (см. раздел «Административный инструмент» в spec.md); выставляется вручную в БД |
| createdAt | datetime | |

**Связи**: 1—N с `Receipt`, `BonusTransaction`, `MenuItemLike` (опционально).

**Валидация**: email, phone и telegramId уникальны на уровне БД (FR-017, конфликт → ошибка «Пользователь уже зарегистрирован»); смена email/phone проходит ту же проверку уникальности (FR-024).

## Вход через Telegram

Пароля, отдельной формы регистрации и модели `OAuthAccount` (Google/Apple) в системе нет. Вход через Telegram верифицируется без БД-адаптера: `lib/telegram-auth.ts` проверяет HMAC-подпись виджета (`SHA256(bot_token)` как ключ) и свежесть `auth_date` (≤24ч), затем `lib/auth.ts` делает `prisma.user.upsert()` по `telegramId` напрямую на модели `User` — аккаунт создаётся автоматически при первом входе, отдельная связка-таблица не нужна.

## MenuCategory (Категория / подкатегория меню)

Реализует двухуровневую структуру из FR-001.

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| name | string | напр. «Алкогольные напитки», «Коктейли» |
| slug | string | для URL |
| parentId | UUID \| null | null = категория верхнего уровня; иначе — подкатегория |
| order | int | порядок отображения |

**Валидация**: `parentId` ссылается только на категорию с `parentId = null` (глубина ограничена двумя уровнями).

## MenuItem (Позиция меню)

Соответствует Key Entity «Позиция меню».

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| categoryId | UUID | FK → MenuCategory (обычно подкатегория, если есть) |
| name | string | обязательно |
| description | string | краткое описание |
| price | decimal | > 0, одно значение на позицию (без вариантов объёма — см. Clarifications) |
| currency | string | фиксировано, напр. `RUB` |
| photoUrl | string | обязательно (FR-002) |
| volume | string | напр. «117мл» |
| abv | decimal \| null | крепость, % — только для позиций из подкатегории «Чистый алкоголь»/«Коктейли» |
| createdAt / updatedAt | datetime | |

**Производное поле**: `likesCount` = COUNT(`MenuItemLike` по `menuItemId`) — используется для сортировки в разделе «Популярное» (FR-021); может кэшироваться, источник истины — таблица лайков.

## MenuItemLike (Лайк позиции меню)

Реализует FR-020 и защиту от накрутки (research.md, п.7).

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| menuItemId | UUID | FK → MenuItem |
| visitorId | string | значение cookie `visitor_id`, ставится при первом визите |
| createdAt | datetime | |

**Валидация**: уникальный индекс `(menuItemId, visitorId)` — повторный лайк тем же посетителем удаляет запись (toggle), а не создаёт вторую.

## Receipt (Чек)

Соответствует Key Entity «Чек».

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| date | datetime | дата покупки |
| totalAmount | decimal | сумма чека |
| currency | string | напр. `RUB` |
| createdAt | datetime | когда запись создана в системе (может отличаться от `date`) |

**Связь**: 1—N с `ReceiptItem`; 1—1 (опционально) с `BonusTransaction` (начисление за этот чек).

## ReceiptItem (Состав чека)

Реализует «полный состав покупки» из FR-007.

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| receiptId | UUID | FK → Receipt |
| name | string | снимок названия позиции на момент покупки (не FK на `MenuItem`, чтобы не ломаться при изменении/удалении позиции) |
| price | decimal | цена за единицу на момент покупки |
| quantity | int | ≥ 1 |

## BonusTransaction (Операция по бонусам)

Реализует историю операций из FR-010; текущий бонусный баланс — это **вычисляемая** сумма всех операций пользователя (SUM(`amount`)), отдельного хранимого поля баланса нет, чтобы избежать рассинхронизации.

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK → User |
| amount | decimal | положительное = начисление, отрицательное = списание (в v1 списаний с сайта нет — FR-025, но поле общее для будущей офлайн-синхронизации) |
| reason | string | напр. «Начисление за чек №…» |
| receiptId | UUID \| null | FK → Receipt, если операция связана с конкретным чеком |
| createdAt | datetime | |

## BonusSettings (Ставка бонусов)

Singleton-запись (`id = "default"`), редактируется в `/admin/bonus-settings`. Определяет процент, который автоматически применяется при внесении чека через `/admin/receipts/new`.

| Поле | Тип | Правила |
|---|---|---|
| id | string | всегда `"default"` |
| percentage | decimal | 0–100, по умолчанию 3 (%) |

## PromoBanner (Баннер акции)

Соответствует Key Entity «Акция (баннер карусели)», реализует FR-008.

| Поле | Тип | Правила |
|---|---|---|
| id | UUID | PK |
| imageUrl | string | |
| title | string | |
| description | string \| null | |
| order | int | порядок в карусели |
| isActive | bool | позволяет скрыть баннер, не удаляя |
| createdAt / updatedAt | datetime | обновляется вручную администрацией |

## SiteContent (Контактные данные / о заведении)

Единый источник для FR-012–FR-014, FR-023. Для v1 допустимо хранить как один конфиг-объект (не отдельная таблица), если не появится необходимость менять эти данные без деплоя — см. quickstart.md.

| Поле | Тип | Правила |
|---|---|---|
| address | string | физический адрес (FR-013) |
| addressMapUrl | string | ссылка на Google Карты (FR-013) |
| mapEmbedUrl | string | URL для встроенной карты (iframe) в футере (FR-013) |
| workingHours | string | единый диапазон, напр. «17:00–23:30» (FR-023) |
| phone | string | (FR-012) |
| instagramUrl | string | (FR-012) |
| googleUrl | string | (FR-012) |
| allergyDisclaimer | string | текст дисклеймера (FR-022) |
| aboutText | string | краткое описание концепции (FR-014) |

## Диаграмма связей (текстовая)

```text
User 1---N Receipt 1---N ReceiptItem
User 1---N BonusTransaction N---1 Receipt (опционально)
MenuCategory 1---N MenuCategory (parentId, самоссылка, максимум 2 уровня)
MenuCategory 1---N MenuItem
MenuItem 1---N MenuItemLike
PromoBanner (независимая таблица, без FK на User)
SiteContent (singleton, без FK)
```
