# Tasks: Сайт бара с меню и клиентским кабинетом

**Input**: Design documents from `/specs/001-bar-menu-account/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Тесты явно не запрошены в спецификации — отдельные тестовые задачи не включены; проверка — через сценарии `quickstart.md` (задача в Phase 6).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можно выполнять параллельно (разные файлы, нет зависимости от незавершённых задач)
- **[Story]**: US1 = Меню, US2 = Личный кабинет, US3 = Контакты/о нас

## Path Conventions

Единый Next.js (App Router) проект в корне репозитория — см. plan.md → Project Structure.

---

## Phase 1: Setup

**Purpose**: инициализация проекта поверх текущего пустого `index.js`/`package.json`.

- [x] T001 Инициализировать Next.js (App Router, TypeScript) проект в корне репозитория, заменив заглушки `index.js`/`package.json`
- [x] T002 [P] Установить и сконфигурировать Prisma (`prisma init`, `DATABASE_URL` в `.env`)
- [x] T003 [P] Настроить ESLint/Prettier под TypeScript/Next.js
- [x] T004 [P] Создать `.env.example` со всеми переменными: `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `APPLE_*`, `SMS_*`
- [x] T005 [P] Базовый `app/layout.tsx` (шрифты, глобальные стили, метаданные сайта)

**Checkpoint**: проект собирается и запускается (`npm run dev`) с пустой домашней страницей.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: инфраструктура, без которой не работает ни один User Story.

**⚠️ CRITICAL**: ни одна из фаз User Story не должна начинаться раньше завершения этой фазы.

- [x] T006 Описать все модели из `data-model.md` в `prisma/schema.prisma` (User, Account/OAuth, PasswordResetCode, MenuCategory, MenuItem, MenuItemLike, Receipt, ReceiptItem, BonusTransaction, PromoBanner, SiteContent)
- [x] T007 Выполнить первую миграцию (`npx prisma migrate dev`)
- [x] T008 [P] Prisma client singleton в `lib/prisma.ts`
- [x] T009 [P] Конфигурация Auth.js (Credentials + Google + Apple providers, JWT-сессия) в `lib/auth.ts`
- [x] T010 [P] Интерфейс `SmsSender` + реализация под выбранного провайдера (или мок для разработки) в `lib/sms-sender.ts`
- [x] T011 [P] Интерфейс `ImageStorage` + локальная реализация (диск VPS) в `lib/image-storage.ts`
- [x] T012 [P] Хелпер расчёта бонусного баланса (агрегация `BonusTransaction`) в `lib/bonuses.ts`
- [x] T013 Route handler Auth.js в `app/api/auth/[...nextauth]/route.ts` (использует `lib/auth.ts`)
- [x] T014 Seed-скрипт `prisma/seed.ts`: тестовые категории/подкатегории, позиции меню, баннер акции, `SiteContent` (по quickstart.md)

**Checkpoint**: база данных готова, аутентификация сконфигурирована, есть демо-данные — можно начинать User Story фазы.

---

## Phase 3: User Story 1 — Просмотр меню (Priority: P1) 🎯 MVP

**Goal**: любой посетитель без регистрации просматривает двухуровневое меню, ищет позиции, ставит лайки, видит «Популярное» (FR-001…FR-003, FR-015, FR-019…FR-022).

**Independent Test**: открыть сайт без входа, пройти по категориям/подкатегориям, воспользоваться поиском и лайком — без обращения к личному кабинету.

- [x] T015 [P] [US1] `GET /api/menu/categories` в `app/api/menu/categories/route.ts`
- [x] T016 [P] [US1] `GET /api/menu/items?categoryId=&search=` в `app/api/menu/items/route.ts`
- [x] T017 [P] [US1] `GET /api/menu/items/popular` в `app/api/menu/items/popular/route.ts`
- [x] T018 [US1] `POST /api/menu/items/:id/like` (toggle по cookie `visitor_id`) в `app/api/menu/items/[id]/like/route.ts`
- [x] T019 [US1] Страница категорий меню `app/(public)/menu/page.tsx` (верхний уровень + подкатегории, поле поиска)
- [x] T020 [US1] Страница позиций (под)категории `app/(public)/menu/[categorySlug]/page.tsx` (фото, название, цена, объём, крепость для алкоголя, кнопка лайка)
- [x] T021 [US1] Страница «Популярное» `app/(public)/menu/popular/page.tsx`
- [x] T022 [US1] Компонент кнопки лайка с оптимистичным toggle `components/MenuItemLikeButton.tsx`
- [x] T023 [US1] Обработка пустых состояний: пустая категория и поиск без совпадений (FR-015, Edge Cases)
- [x] T024 [US1] Блок дисклеймера про аллергии рядом с меню/едой (FR-022)

**Checkpoint**: User Story 1 полностью функциональна и тестируема независимо — это MVP.

---

## Phase 4: User Story 2 — Регистрация и личный кабинет (Priority: P2)

**Goal**: гость регистрируется (email/телефон/пароль или Google/Apple), видит чеки, бонусы, акции в хедере, редактирует профиль (FR-004…FR-011, FR-016…FR-018, FR-024…FR-026).

**Independent Test**: зарегистрировать нового гостя, войти, убедиться в доступе к чекам/бонусам/профилю и в редиректе неавторизованных.

- [x] T025 [P] [US2] `POST /api/auth/register` (email/телефон/пароль, `409` при занятом email/телефоне — FR-017) в `app/api/auth/register/route.ts`
- [x] T026 [P] [US2] `POST /api/auth/password-reset/request` (SMS-код через `SmsSender`) в `app/api/auth/password-reset/request/route.ts`
- [x] T027 [P] [US2] `POST /api/auth/password-reset/confirm` в `app/api/auth/password-reset/confirm/route.ts`
- [x] T028 [P] [US2] `GET/PATCH /api/account/profile` (смена пароля требует `currentPassword` — FR-024) в `app/api/account/profile/route.ts`
- [x] T029 [P] [US2] `POST /api/account/phone` (телефон для OAuth-пользователей — FR-026) в `app/api/account/phone/route.ts`
- [x] T030 [P] [US2] `GET /api/account/receipts` и `GET /api/account/receipts/:id` (проверка владельца — FR-011) в `app/api/account/receipts/route.ts`, `app/api/account/receipts/[id]/route.ts`
- [x] T031 [P] [US2] `GET /api/account/bonuses` (баланс + история) в `app/api/account/bonuses/route.ts`
- [x] T032 [P] [US2] `GET /api/promo-banners` в `app/api/promo-banners/route.ts`
- [x] T033 [US2] Страницы входа/регистрации `app/(account)/login/page.tsx`, `app/(account)/register/page.tsx` (email/телефон/пароль + кнопки Google/Apple)
- [x] T034 [US2] Обзорная страница кабинета `app/(account)/account/page.tsx` (приветствие при первом входе — FR-016)
- [x] T035 [US2] Чеки: список и детали `app/(account)/account/receipts/page.tsx`, `app/(account)/account/receipts/[id]/page.tsx`
- [x] T036 [US2] Бонусы: баланс + история `app/(account)/account/bonuses/page.tsx`
- [x] T037 [US2] Профиль: редактирование данных, смена пароля `app/(account)/account/profile/page.tsx`
- [x] T038 [US2] Защита `/account/*` (редирект неавторизованных на `/login` — FR-006) в `proxy.ts` (переименовано из `middleware.ts` — Next.js 16 конвенция)
- [x] T039 [US2] Компонент карусели акций в хедере `components/PromoCarousel.tsx`, подключён в `app/layout.tsx` через `components/SiteHeader.tsx`

**Checkpoint**: User Story 1 и 2 работают независимо друг от друга.

---

## Phase 5: User Story 3 — Контакты, локация и о заведении (Priority: P3)

**Goal**: адрес/часы работы рядом с меню, кликабельные телефон/соцсети/карта, блок «о нас» на главной (FR-012…FR-014, FR-023).

**Independent Test**: открыть сайт без входа, найти виджет адреса/часов на странице меню, контакты и «о нас» — без личного кабинета.

- [x] T040 [P] [US3] `GET /api/site-content` (адрес, карта, часы, телефон, соцсети, дисклеймер, текст «о нас») в `app/api/site-content/route.ts`
- [x] T041 [US3] Главная страница `app/(public)/page.tsx` (hero, блок «о нас»)
- [x] T042 [US3] Постоянный виджет «Інформація про заклад» (адрес-ссылка на Google Карты + часы) рядом с меню — общий layout `app/(public)/menu/layout.tsx`
- [x] T043 [US3] Футер сайта: кликабельный телефон, ссылки на соцсети, встроенная карта — `components/SiteFooter.tsx`, подключён в `app/layout.tsx`

**Checkpoint**: все три User Story работают независимо.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T044 [P] Адаптивная вёрстка виджета адреса/часов и сайдбара меню для мобильных экранов (медиа-запросы в `globals.css`, брейкпоинт 720px)
- [x] T045 [P] Единые состояния загрузки/ошибок для страниц меню и кабинета (`app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`)
- [x] T046 Прогнать вручную все сценарии из `quickstart.md` (регресс по всем трём User Story проверен через curl на живом сервере)
- [x] T047 [P] Проверка безопасности: хеширование паролей (bcrypt) ✓, httpOnly JWT-cookie сессии (Auth.js) ✓, ограничение попыток SMS-кода (5 попыток) ✓, добавлен cooldown 60с на повторный запрос кода ✓

---

## Phase 7: Административный инструмент (внепланово, по запросу пользователя)

**Goal**: минимальная админка — настройка ставки бонусов (3% по умолчанию) и ручное внесение чеков персоналом с автоматическим начислением бонуса (см. spec.md → «Административный инструмент»).

- [x] T048 [P] Флаг `User.isAdmin` + модель `BonusSettings` (singleton) в `prisma/schema.prisma`, миграция `admin_and_bonus_settings`
- [x] T049 [P] `isAdmin` в JWT/сессии Auth.js (`lib/auth.ts`, `next-auth.d.ts`)
- [x] T050 [P] Хелпер `requireAdmin()` в `lib/require-admin.ts`; защита `/admin/*` в `proxy.ts` (редирект не-админов на `/account`)
- [x] T051 [P] `lib/bonus-settings.ts` (получить/задать ставку, по умолчанию 3%)
- [x] T052 [P] `GET/PATCH /api/admin/bonus-settings` в `app/api/admin/bonus-settings/route.ts`
- [x] T053 [P] `POST /api/admin/receipts` — внесение чека по телефону гостя, автоматический расчёт и начисление бонуса по текущей ставке — `app/api/admin/receipts/route.ts`
- [x] T054 Страницы `app/(admin)/admin/page.tsx`, `app/(admin)/admin/bonus-settings/page.tsx`, `app/(admin)/admin/receipts/new/page.tsx`
- [x] T055 Ссылка «Адмін» в хедере для администраторов (`components/SiteHeader.tsx`)
- [x] T056 Демо-админ и `BonusSettings` (3%) в `prisma/seed.ts` (`admin@example.com` / `admin12345`)

**Проверено вручную**: вход админом, смена ставки 3%→5%→3%, внесение чека (600 ₴ → бонус 30 ₴ при 5%), отказ доступа обычному гостю (403/307) и неавторизованному (401), валидация процента (0–100) и несуществующего телефона (404).

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: блокирует все User Story.
- **US1 (Phase 3)**: не зависит от US2/US3 — может быть отдельным релизом (MVP).
- **US2 (Phase 4)**: использует общий layout/хедер из Foundational; не блокируется US1, но реалистично идёт после него.
- **US3 (Phase 5)**: независим от US1/US2, использует общий layout.
- **Polish (Phase 6)**: после нужных User Story.

## Implementation Strategy

1. Phase 1 + Phase 2 — фундамент.
2. Phase 3 (US1) — публичное меню как MVP, можно показать заказчику.
3. Phase 4 (US2) — личный кабинет и программа лояльности.
4. Phase 5 (US3) — контакты/о нас.
5. Phase 6 — полировка и ручная валидация по quickstart.md.

## Notes

- Задачи с [P] — разные файлы, можно параллелить.
- Открытые бизнес-решения из `spec.md` → «Open Decisions Before Implementation» (формула бонусов, источник чеков, демо vs реальные интеграции, админ-панель) не блокируют Phase 1–3, но должны быть закрыты до начала T025–T032 (регистрация/бонусы/чеки) в Phase 4.
