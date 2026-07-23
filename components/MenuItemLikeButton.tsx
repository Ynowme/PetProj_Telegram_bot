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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        border: "1px solid var(--border)",
        borderRadius: 999,
        padding: "0.3rem 0.7rem",
        background: liked ? "var(--accent)" : "transparent",
        color: liked ? "var(--accent-contrast)" : "inherit",
        cursor: "pointer",
      }}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span>{likesCount}</span>
    </button>
  );
}
