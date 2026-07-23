"use client";

import { useEffect, useRef, useState } from "react";
import "./GooeyNav.css";

export interface GooeyNavItem {
  label: string;
  href: string;
  kind?: "link" | "signout";
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  activeIndex: number;
  onNavigate: (item: GooeyNavItem, index: number) => void;
}

const GooeyNav = ({ items, activeIndex, onNavigate }: GooeyNavProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [internalActiveIndex, setInternalActiveIndex] = useState(activeIndex);
  const [syncedActiveIndex, setSyncedActiveIndex] = useState(activeIndex);

  if (activeIndex !== syncedActiveIndex) {
    setSyncedActiveIndex(activeIndex);
    setInternalActiveIndex(activeIndex);
  }

  const updateEffectPosition = (element: HTMLElement) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    Object.assign(filterRef.current.style, styles);
    Object.assign(textRef.current.style, styles);
    textRef.current.innerText = element.innerText;
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, item: GooeyNavItem, index: number) => {
    e.preventDefault();
    const liEl = e.currentTarget.parentElement as HTMLElement | null;
    if (item.kind !== "signout" && internalActiveIndex === index) return;

    setInternalActiveIndex(index);
    if (liEl) updateEffectPosition(liEl);
    textRef.current?.classList.add("active");

    onNavigate(item, index);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>, item: GooeyNavItem, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, item, index);
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current || activeIndex < 0) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex] as HTMLElement | undefined;
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add("active");
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[activeIndex] as HTMLElement | undefined;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={item.label} className={internalActiveIndex === index ? "active" : ""}>
              <a
                href={item.href}
                onClick={(e) => handleClick(e, item, index)}
                onKeyDown={(e) => handleKeyDown(e, item, index)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} />
      <span className="effect text" ref={textRef} />
    </div>
  );
};

export default GooeyNav;
export { GooeyNav };
