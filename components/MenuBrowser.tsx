"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@heroui/react";
import { MenuItemCard } from "@/components/MenuItemCard";
import type { MenuSection } from "@/lib/menu";

// Одна безперервна сторінка меню зі scrollspy-навігацією (T042-редизайн v2, за
// зразком двоярусної липкої навігації еталонного сайту): верхній ряд — топ-категорії,
// нижній — підкатегорії поточної (з'являється лише коли в активної категорії вони є).
// Топ-категорія — або вітка з підкатегоріями, або лист із власними позиціями,
// ніколи не обидва одразу (правило з lib/menu.ts getMenuSections/getMenuCategories).
type TrackedSection = { slug: string; topSlug: string };

// Липка стрічка пігулок скролиться вбік; текст біля країв плавно тоне замість різкого
// обрізання (reference-ефект "стрічки") — маска симетрична з обох боків, без JS.
const TAB_STRIP_CLASS =
  "flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "[mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)] " +
  "[-webkit-mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]";

function tabClass(isActive: boolean, isSub = false) {
  const base =
    "min-h-11 flex-none whitespace-nowrap rounded-full border transition active:scale-[0.97] " +
    (isSub ? "px-3.5 py-1.5 text-xs " : "px-4 py-2 text-sm ");
  return isActive
    ? `${base}border-transparent bg-accent font-semibold text-accent-foreground`
    : `${base}border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground`;
}

export function MenuBrowser({ sections }: { sections: MenuSection[] }) {
  const trackedSections = useMemo<TrackedSection[]>(
    () =>
      sections.flatMap((section) =>
        section.children.length > 0
          ? section.children.map((child) => ({ slug: child.slug, topSlug: section.slug }))
          : [{ slug: section.slug, topSlug: section.slug }],
      ),
    [sections],
  );

  const [activeSlug, setActiveSlug] = useState(trackedSections[0]?.slug ?? "");
  // Кнопка "…" на липкій стрічці категорій (reference: easy.choiceqr.com) — повний список
  // усіх топ-категорій із підкатегоріями для швидкого переходу, коли сама стрічка не
  // вміщає всі пункти й доводиться скролити вбік.
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  // Хеш адреси на момент першого рендеру (до будь-яких ефектів) — інакше ефект
  // синхронізації activeSlug->URL нижче встигає замінити його дефолтною секцією
  // раніше, ніж ми встигнемо його прочитати й проскролити до потрібного розділу.
  const initialHash = useRef(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
  const [headerHeight, setHeaderHeight] = useState(0);
  const [primaryHeight, setPrimaryHeight] = useState(0);
  const [offset, setOffset] = useState(0);
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  // Клік по вкладці запускає плавний скрол через кілька секцій — на цей час
  // ігноруємо IntersectionObserver, інакше активна вкладка "сіпається" проміжними
  // секціями замість того, щоб одразу піти на клікнуту.
  const skippingSpy = useRef(false);
  const skipSpyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeTopSlug = trackedSections.find((section) => section.slug === activeSlug)?.topSlug ?? sections[0]?.slug;
  const activeTop = sections.find((section) => section.slug === activeTopSlug);
  const hasSubTabs = Boolean(activeTop && activeTop.children.length > 0);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;

    const recalc = () => {
      setHeaderHeight(header?.offsetHeight ?? 0);
      setPrimaryHeight(primary?.offsetHeight ?? 0);
      setOffset((header?.offsetHeight ?? 0) + (primary?.offsetHeight ?? 0) + (secondary?.offsetHeight ?? 0));
    };

    recalc();

    // ResizeObserver, не window "resize" — реальна висота шапки/вкладок може змінитись без
    // ресайзу вікна (шрифт чи CSS довантажились вже після першого виміру, наприклад), а
    // window "resize" такі випадки пропускає. Раніше цю прогалину маскував побічний ефект
    // SiteHeaderShell: кожна зміна напрямку скролу дисптачила синтетичний "resize", який
    // випадково перевимірював і виправляв застряглий top:0. Тепер той дисптач прибрано
    // (шапка більше не ховається при скролі), тож вимір має бути правильним сам по собі.
    const observer = new ResizeObserver(recalc);
    if (header) observer.observe(header);
    if (primary) observer.observe(primary);
    if (secondary) observer.observe(secondary);
    return () => observer.disconnect();
  }, [hasSubTabs]);

  useEffect(() => {
    if (offset === 0 || trackedSections.length === 0) return;

    // Спостерігаємо за тонкою смугою одразу під липкими панелями — яка секція
    // її перетинає, та й активна.
    const bandHeight = 4;
    const observer = new IntersectionObserver(
      (entries) => {
        if (skippingSpy.current) return;
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        const slug = topMost.target.getAttribute("data-section-slug");
        if (slug) setActiveSlug(slug);
      },
      {
        rootMargin: `-${offset}px 0px -${Math.max(window.innerHeight - offset - bandHeight, 0)}px 0px`,
        threshold: 0,
      },
    );
    trackedSections.forEach(({ slug }) => {
      const element = sectionRefs.current.get(slug);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [offset, trackedSections]);

  // Синхронізація активної секції з URL (hash) — щоб можна було дати пряме
  // посилання на розділ меню. Перший запуск на монтуванні пропускаємо: інакше він
  // одразу замінить хеш з адресного рядка (напр. #cocktails) дефолтною першою
  // секцією ще до того, як ефект нижче встигне його прочитати.
  const skippedInitialUrlSync = useRef(false);
  useEffect(() => {
    if (!skippedInitialUrlSync.current) {
      skippedInitialUrlSync.current = true;
      return;
    }
    if (!activeSlug) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${activeSlug}`);
  }, [activeSlug]);

  // Відкриття сторінки з хешем в адресі — прокручуємо до потрібної секції, щойно
  // відомі висоти липких панелей (offset), інакше секція опиниться під ними.
  const appliedInitialHash = useRef(false);
  useEffect(() => {
    if (appliedInitialHash.current || offset === 0) return;
    appliedInitialHash.current = true;
    const hash = initialHash.current;
    if (!hash) return;
    const target = sectionRefs.current.get(hash);
    if (!target) return;
    setActiveSlug(hash);
    target.scrollIntoView({ behavior: "auto" });
  }, [offset]);

  function scrollToSection(slug: string) {
    const target = sectionRefs.current.get(slug);
    if (!target) return;
    skippingSpy.current = true;
    clearTimeout(skipSpyTimeout.current);
    skipSpyTimeout.current = setTimeout(() => {
      skippingSpy.current = false;
    }, 700);
    setActiveSlug(slug);
    target.scrollIntoView({ behavior: "smooth" });
  }

  function selectFromCategoryMenu(slug: string) {
    setIsCategoryMenuOpen(false);
    scrollToSection(slug);
  }

  useEffect(() => {
    if (!isCategoryMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCategoryMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCategoryMenuOpen]);

  return (
    // min-w-0 — батьківські grid-контейнери (menu/page.tsx і menu/layout.tsx) не дають
    // скрол-стрічці вкладок форсувати ширину сторінки за viewport (деталі — в історії
    // коміту: grid-елементи мають дефолтний min-width:auto, не 0).
    <div className="min-w-0">
      <div className="mb-4 mt-4 grid gap-2.5">
        <Link
          href="/menu/popular"
          className="flex min-h-[52px] items-center rounded-xl border border-border bg-surface px-4 py-3 text-foreground transition hover:bg-surface-hover active:scale-[0.98]"
        >
          ★ Популярне
        </Link>
      </div>

      {/* Липкий РЯДОК вкладок: скролима стрічка пігулок + кнопка "…" як звичайний flex-сусід
          ЗА МЕЖАМИ скрол-контейнера — на реальному мобільному Chrome position:sticky по
          правому краю всередині scroll-контейнера не спрацював (звіт 2026-08-16). */}
      <div ref={primaryRef} className="sticky z-50 flex items-center border-b border-border bg-background py-2" style={{ top: headerHeight }}>
        <div className={TAB_STRIP_CLASS}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={tabClass(section.slug === activeTopSlug)}
              onClick={() => scrollToSection(section.children.length > 0 ? section.children[0].slug : section.slug)}
            >
              {section.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Усі категорії"
          onClick={() => setIsCategoryMenuOpen(true)}
          className="mr-4 inline-flex size-11 flex-none items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-hover active:scale-[0.97] md:mr-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {isCategoryMenuOpen && (
        <div role="presentation" className="fixed inset-0 z-[1000] flex flex-col bg-background" onClick={() => setIsCategoryMenuOpen(false)}>
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-6">
            <h2 className="m-0 text-lg font-semibold">Категорії</h2>
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen(false)}
              aria-label="Закрити"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm text-foreground transition hover:bg-surface-hover active:scale-[0.97]"
            >
              Закрити ✕
            </button>
          </div>
          <div className="overflow-y-auto px-4 pb-8 pt-2 md:px-6" onClick={(event) => event.stopPropagation()}>
            {sections.map((section) => (
              <div key={section.id}>
                <button
                  type="button"
                  className="block min-h-11 w-full border-b border-separator px-1 py-3.5 text-left text-base font-semibold text-foreground transition hover:bg-surface-hover active:scale-[0.99]"
                  onClick={() => selectFromCategoryMenu(section.children.length > 0 ? section.children[0].slug : section.slug)}
                >
                  {section.name}
                </button>
                {section.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    className="block min-h-11 w-full border-b border-separator py-3 pl-6 pr-1 text-left text-sm text-muted transition hover:bg-surface-hover hover:text-foreground active:scale-[0.99]"
                    onClick={() => selectFromCategoryMenu(child.slug)}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSubTabs && activeTop && (
        <div
          ref={secondaryRef}
          className="sticky z-50 flex items-center border-b border-border bg-surface-secondary py-1.5"
          style={{ top: headerHeight + primaryHeight }}
        >
          <div className={TAB_STRIP_CLASS}>
            {activeTop.children.map((child) => (
              <button key={child.id} type="button" className={tabClass(child.slug === activeSlug, true)} onClick={() => scrollToSection(child.slug)}>
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.map((section) =>
        section.children.length > 0 ? (
          section.children.map((child) => (
            <MenuSectionBlock
              key={child.id}
              slug={child.slug}
              name={child.name}
              items={child.items}
              offset={offset}
              registerRef={(element) => {
                if (element) sectionRefs.current.set(child.slug, element);
              }}
            />
          ))
        ) : (
          <MenuSectionBlock
            key={section.id}
            slug={section.slug}
            name={section.name}
            items={section.items}
            offset={offset}
            registerRef={(element) => {
              if (element) sectionRefs.current.set(section.slug, element);
            }}
          />
        ),
      )}
    </div>
  );
}

function MenuSectionBlock({
  slug,
  name,
  items,
  offset,
  registerRef,
}: {
  slug: string;
  name: string;
  items: MenuSection["items"];
  offset: number;
  registerRef: (element: HTMLElement | null) => void;
}) {
  return (
    <section id={slug} data-section-slug={slug} ref={registerRef} className="pt-6" style={{ scrollMarginTop: offset + 12 }}>
      <h2 className="mb-4 text-xl font-semibold text-foreground">{name}</h2>
      {items.length === 0 ? (
        <EmptyState className="rounded-2xl border border-dashed border-border py-8 text-center">
          У цій категорії поки немає позицій.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} variant="tile" />
          ))}
        </div>
      )}
    </section>
  );
}
