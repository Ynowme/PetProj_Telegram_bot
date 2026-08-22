"use client";

import { useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Chip, Modal } from "@heroui/react";
import { PLACEHOLDER_PHOTO_URL, type SerializedMenuItem } from "@/lib/menu";
import { MenuItemLikeButton } from "@/components/MenuItemLikeButton";

// Опис у списку — обрізаний до 2 рядків з інлайновою кнопкою "показати" в кінці, щоб
// картки в списку були однакової висоти незалежно від довжини опису (на відміну від
// модалки з фото, де опис завжди показується повністю). У плитці (variant="tile" на
// десктопі) опис ховається зовсім — md:hidden передається ззовні через className.
function DescriptionClamp({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <p className={`my-1.5 text-sm text-muted ${expanded ? "" : "line-clamp-2"} ${className}`}>
      {text}{" "}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setExpanded((value) => !value);
        }}
        className="inline cursor-pointer border-none bg-transparent p-0 font-semibold text-accent"
      >
        {expanded ? "сховати" : "показати"}
      </button>
    </p>
  );
}

function VolumeAbvLine({ item }: { item: SerializedMenuItem }) {
  if (!item.volume && item.abv === null) return null;
  return (
    <p className="m-0 text-xs text-muted">
      {item.volume}
      {item.abv !== null ? ` · ${item.abv}%` : ""}
    </p>
  );
}

function NewBadge() {
  return (
    <Chip size="sm" color="accent">
      Новинка
    </Chip>
  );
}

function PlaceholderNameOverlay({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center p-1.5 text-center text-xs leading-tight text-background [font-family:var(--font-yeseva)] [text-shadow:0_0_4px_rgba(255,255,255,0.9),0_0_8px_rgba(255,255,255,0.6)]"
    >
      {name}
    </span>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

// Поділитися позицією: нативний Web Share на мобільних (де він і найкорисніший),
// фолбек — скопіювати посилання на поточну сторінку меню в буфер обміну.
function ShareButton({ item }: { item: SerializedMenuItem }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (event: ReactMouseEvent) => {
    event.stopPropagation();
    if (typeof window === "undefined") return;

    const shareData = {
      title: item.name,
      text: `${item.name}, ${item.price} ${item.currency}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Користувач закрив діалог — це не помилка.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер обміну недоступний (напр. немає дозволу) — тихо ігноруємо.
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={`Поділитися ${item.name}`}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-transparent text-muted transition hover:bg-surface-hover hover:text-foreground active:scale-[0.97]"
    >
      {copied ? "✓" : <ShareIcon />}
    </button>
  );
}

// Єдина картка позиції — один DOM для Пошуку/Популярного/секцій меню.
// variant="row" (дефолт) — рядок "фото зліва" завжди; variant="tile" — той самий рядок на
// мобільному, але плитка з великим фото на десктопі (використовується лише всередині
// сітки секцій MenuBrowser). Раніше це перемикалось медіа-запитом .menu-item-grid у
// globals.css — тепер явним пропом, без каскадних !important.
export function MenuItemCard({ item, variant = "row" }: { item: SerializedMenuItem; variant?: "row" | "tile" }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const hasNoPhoto = item.photoUrl === PLACEHOLDER_PHOTO_URL || photoFailed;
  const photoSrc = photoFailed ? PLACEHOLDER_PHOTO_URL : item.photoUrl;
  const [isOpen, setIsOpen] = useState(false);

  const isTile = variant === "tile";

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        aria-label={`Показати ${item.name} детальніше`}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event: ReactKeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={`flex cursor-pointer gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:bg-surface-hover active:scale-[0.98] ${
          isTile ? "md:flex-col md:gap-0 md:overflow-hidden md:p-0 md:hover:-translate-y-0.5" : ""
        }`}
      >
        <div
          className={`relative size-24 shrink-0 overflow-hidden rounded-lg bg-surface-secondary ${
            isTile ? "md:aspect-square md:size-auto md:w-full md:rounded-none" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- локальные/будущие S3-фото, next/image добавим при подключении реального ImageStorage-CDN */}
          <img src={photoSrc} alt={item.name} onError={() => setPhotoFailed(true)} className="size-full object-cover" />
          {hasNoPhoto && <PlaceholderNameOverlay name={item.name} />}
        </div>
        <div className={`min-w-0 flex-1 ${isTile ? "md:p-3.5" : ""}`}>
          <div className="flex flex-wrap justify-between gap-3">
            <h3 className={`m-0 flex min-w-0 flex-wrap items-center gap-2 break-words text-base font-semibold ${isTile ? "md:text-sm" : ""}`}>
              {item.name}
              {item.isNew && <NewBadge />}
            </h3>
            <strong className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
              {item.price} {item.currency}
            </strong>
          </div>
          {item.description && <DescriptionClamp text={item.description} className={isTile ? "md:hidden" : ""} />}
          <VolumeAbvLine item={item} />
          <div className="mt-2.5 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
            <ShareButton item={item} />
          </div>
        </div>
      </article>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            {/* max-h + власний скрол: фото 1:1 плюс опис можуть бути вищі за екран телефона */}
            <Modal.Dialog aria-label={item.name} className="max-h-[90dvh] overflow-y-auto rounded-2xl p-0">
              <Modal.CloseTrigger
                aria-label="Закрити"
                className="absolute right-3 top-3 z-10 text-foreground [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.6))]"
              />

              <div className="relative aspect-square w-full bg-surface-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element -- див. коментар вище */}
                <img src={photoSrc} alt={item.name} onError={() => setPhotoFailed(true)} className="size-full object-cover" />
                {hasNoPhoto && <PlaceholderNameOverlay name={item.name} />}
              </div>

              <Modal.Body className="p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="m-0 flex flex-wrap items-center gap-2 text-lg font-semibold">
                    {item.name}
                    {item.isNew && <NewBadge />}
                  </h2>
                  <strong className="shrink-0 text-lg font-semibold tabular-nums text-accent">
                    {item.price} {item.currency}
                  </strong>
                </div>
                {item.description && <p className="mt-2.5 text-sm leading-6 text-muted">{item.description}</p>}
                <VolumeAbvLine item={item} />
                <div className="mt-4 flex items-center gap-2">
                  <MenuItemLikeButton menuItemId={item.id} initialLikesCount={item.likesCount} />
                  <ShareButton item={item} />
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
