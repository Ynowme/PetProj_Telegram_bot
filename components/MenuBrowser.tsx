"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MenuItemCard } from "@/components/MenuItemCard";
import type { MenuSection } from "@/lib/menu";

// Одна безперервна сторінка меню зі scrollspy-навігацією (T042-редизайн v2, за
// зразком двоярусної липкої навігації еталонного сайту): верхній ряд — топ-категорії,
// нижній — підкатегорії поточної (з'являється лише коли в активної категорії вони є).
// Топ-категорія — або вітка з підкатегоріями, або лист із власними позиціями,
// ніколи не обидва одразу (правило з lib/menu.ts getMenuSections/getMenuCategories).
type TrackedSection = { slug: string; topSlug: string };

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
    const recalc = () => {
      const header = document.querySelector<HTMLElement>(".site-header__sticky")?.offsetHeight ?? 0;
      const primary = primaryRef.current?.offsetHeight ?? 0;
      const secondary = secondaryRef.current?.offsetHeight ?? 0;
      setHeaderHeight(header);
      setPrimaryHeight(primary);
      setOffset(header + primary + secondary);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
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

  return (
    <div className="menu-browser">
      <div className="category-grid" style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <Link href="/menu/popular" className="category-block">
          ★ Популярне
        </Link>
      </div>

      <div ref={primaryRef} className="menu-tabs menu-tabs--primary" style={{ top: headerHeight }}>
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`menu-tab${section.slug === activeTopSlug ? " menu-tab--active" : ""}`}
            onClick={() => scrollToSection(section.children.length > 0 ? section.children[0].slug : section.slug)}
          >
            {section.name}
          </button>
        ))}
      </div>

      {hasSubTabs && activeTop && (
        <div ref={secondaryRef} className="menu-tabs menu-tabs--secondary" style={{ top: headerHeight + primaryHeight }}>
          {activeTop.children.map((child) => (
            <button
              key={child.id}
              type="button"
              className={`menu-tab menu-tab--sub${child.slug === activeSlug ? " menu-tab--active" : ""}`}
              onClick={() => scrollToSection(child.slug)}
            >
              {child.name}
            </button>
          ))}
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
    <section id={slug} data-section-slug={slug} ref={registerRef} className="menu-section" style={{ scrollMarginTop: offset + 12 }}>
      <h2>{name}</h2>
      {items.length === 0 ? (
        <p className="text-muted">У цій категорії поки немає позицій.</p>
      ) : (
        <div className="menu-item-grid">
          {items.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
