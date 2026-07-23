# Implementation Plan: Сайт бара с меню и клиентским кабинетом

**Branch**: `001-bar-menu-account` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-bar-menu-account/spec.md`

## Summary

Сайт-визитка бара на Next.js: публичное двухуровневое меню с поиском, лайками и разделом «Популярное»; личный кабинет гостя (регистрация и вход только через Telegram Login Widget, история чеков с полным составом, история и баланс бонусов, редактирование профиля); свайпаемая карусель акций в хедере; блок контактов/адреса/часов работы рядом с меню и на главной странице с описанием концепции заведения. Технический подход — единый Next.js (App Router, TypeScript) проект с PostgreSQL/Prisma, аутентификацией на Auth.js и деплоем на VPS (см. research.md).

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS

**Primary Dependencies**: Next.js (App Router), Auth.js (NextAuth) с единственным Credentials provider — верификация Telegram Login Widget, Prisma ORM

**Storage**: PostgreSQL (данные приложения через Prisma); локальная файловая система VPS за интерфейсом `ImageStorage` (фото позиций меню и баннеров акций)

**Testing**: Vitest/Jest (unit/сервисный слой), Playwright (E2E по сценариям quickstart.md)

**Target Platform**: Linux VPS (Node.js процесс под PM2, Nginx как reverse proxy/TLS)

**Project Type**: web — единый full-stack Next.js проект (SSR-страницы + API route handlers)

**Performance Goals**: см. SC-001/SC-003 в spec.md (меню находится за ≤10с, чек/баланс — за ≤3 перехода); отдельных строгих RPS-целей не задано — ориентир: комфортная работа для одного заведения (не высоконагруженный сервис)

**Constraints**: SC-005 — личный кабинет работает без деградации при ≥100 одновременных зарегистрированных пользователях; Telegram Login Widget — внешняя зависимость, требует публичный HTTPS-домен, привязанный через `/setdomain` (research.md, п.4)

**Scale/Scope**: один бар, 3 пользовательских сценария (P1–P3) из spec.md; личный кабинет — не e-commerce (нет онлайн-оплаты/заказов, см. Assumptions в spec.md)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` в проекте пока не заполнена (остаётся шаблоном без реальных принципов) — специфичных для проекта gate-проверок нет. Явных нарушений общих инженерных практик (простота, отсутствие лишних абстракций) в разделе Technical Context/Project Structure ниже не выявлено. При необходимости зафиксировать принципы проекта — отдельно выполнить `/speckit-constitution`.

## Project Structure

### Documentation (this feature)

```text
specs/001-bar-menu-account/
├── plan.md              # Этот файл (/speckit-plan)
├── research.md          # Фаза 0 (/speckit-plan)
├── data-model.md         # Фаза 1 (/speckit-plan)
├── quickstart.md         # Фаза 1 (/speckit-plan)
├── contracts/
│   └── api.md            # Фаза 1 (/speckit-plan)
├── checklists/
│   └── requirements.md
└── tasks.md              # Фаза 2 (/speckit-tasks — ещё не создан)
```

### Source Code (repository root)

```text
app/
├── (public)/
│   ├── page.tsx                    # Главная: hero, «о нас», часы/адрес, контакты
│   ├── menu/
│   │   ├── page.tsx                 # Список категорий/подкатегорий, поиск
│   │   ├── [categorySlug]/page.tsx  # Позиции категории/подкатегории
│   │   └── popular/page.tsx         # Раздел «Популярное»
│   └── layout.tsx                   # Общий хедер (карусель акций) + футер (контакты, карта)
├── (account)/
│   ├── login/page.tsx       # Только Telegram Login Widget, без формы пароля
│   └── account/
│       ├── page.tsx                 # Обзор/приветствие при первом входе
│       ├── receipts/page.tsx
│       ├── receipts/[id]/page.tsx
│       ├── bonuses/page.tsx
│       └── profile/page.tsx
└── api/
    ├── auth/[...nextauth]/route.ts   # Auth.js handler (Telegram Credentials provider)
    ├── menu/categories/route.ts
    ├── menu/items/route.ts
    ├── menu/items/popular/route.ts
    ├── menu/items/[id]/like/route.ts
    ├── account/profile/route.ts
    ├── account/phone/route.ts
    ├── account/receipts/route.ts
    ├── account/receipts/[id]/route.ts
    ├── account/bonuses/route.ts
    ├── promo-banners/route.ts
    └── site-content/route.ts

lib/
├── auth.ts               # конфигурация Auth.js (единственный Credentials provider — Telegram)
├── telegram-auth.ts        # верификация HMAC-подписи Telegram Login Widget
├── prisma.ts              # Prisma client singleton
├── image-storage.ts        # интерфейс ImageStorage + локальная реализация (VPS-диск)
└── bonuses.ts              # расчёт/агрегация бонусного баланса из BonusTransaction

prisma/
├── schema.prisma           # модели из data-model.md
└── seed.ts                 # тестовые категории/позиции/баннер/SiteContent

tests/
├── unit/                   # bonuses.ts, like-toggle, валидация уникальности
├── contract/                # тесты по contracts/api.md
└── e2e/                     # Playwright-сценарии из quickstart.md
```

**Structure Decision**: Единый Next.js проект (Option "web application", но без разделения backend/frontend на отдельные пакеты — App Router даёт SSR-страницы и API route handlers в одном дереве `app/`). Общая бизнес-логика и интеграции с внешними сервисами (хранилище изображений, расчёт бонусов) вынесены в `lib/`, чтобы route handlers оставались тонкими, а `ImageStorage` можно было заменить (см. research.md) без изменения вызывающего кода.

## Complexity Tracking

*Раздел не заполняется — нарушений Constitution Check нет (принципы проекта ещё не зафиксированы, явных избыточных абстракций не введено).*
