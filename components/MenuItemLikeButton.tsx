"use client";

import { useState, useTransition } from "react";

// FR-020: оптимистичный toggle лайка без регистрации.
export function MenuItemLikeButton({
  menuItemId,
  initialLikesCount,
}: {
  menuItemId: string;
  initialLikesCount: number;
}) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const previousLiked = liked;
    const previousCount = likesCount;

    setLiked(!previousLiked);
    setLikesCount(previousLiked ? previousCount - 1 : previousCount + 1);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/menu/items/${menuItemId}/like`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("like request failed");

        const data = (await response.json()) as { liked: boolean; likesCount: number };
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      } catch {
        setLiked(previousLiked);
        setLikesCount(previousCount);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3.5 text-sm tabular-nums transition active:scale-[0.97] disabled:opacity-60 ${
        liked
          ? "border-transparent bg-accent text-accent-foreground"
          : "border-border bg-transparent text-foreground hover:bg-surface-hover"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{likesCount}</span>
    </button>
  );
}
