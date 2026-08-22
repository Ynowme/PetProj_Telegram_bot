"use client";

import { useEffect, useState } from "react";
import { Card, Chip, Skeleton } from "@heroui/react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";

type Review = {
  id: string;
  dishesRating: number;
  serviceRating: number;
  comment: string | null;
  contactName: string | null;
  contactPhone: string | null;
  createdAt: string;
  guest: { id: string; name: string; telegramUsername: string | null; phone: string | null } | null;
};

const MAX_RATING = 5;
// Нижче цієї оцінки відгук підсвічується як проблемний — щоб низькі оцінки
// не губилися у списку і власник бачив їх першим поглядом.
const LOW_RATING_THRESHOLD = 3;

function ratingColor(value: number): "success" | "warning" | "danger" {
  if (value < LOW_RATING_THRESHOLD) return "danger";
  if (value < MAX_RATING) return "warning";
  return "success";
}

function RatingChip({ label, value }: { label: string; value: number }) {
  return (
    <Chip color={ratingColor(value)} variant="soft" size="sm">
      {label}: {value}/{MAX_RATING}
    </Chip>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span aria-label={`${value} з ${MAX_RATING}`} className="text-sm tracking-wider">
      <span className="text-warning">{"★".repeat(value)}</span>
      <span className="text-muted">{"☆".repeat(MAX_RATING - value)}</span>
    </span>
  );
}

export function ReviewsPanel() {
  const [items, setItems] = useState<Review[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((response) => (response.ok ? (response.json() as Promise<Review[]>) : null))
      .then((data) => {
        if (data) setItems(data);
      });
  }, []);

  if (items === null) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((index) => (
          <Card key={index}>
            <Card.Content className="grid gap-2">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-40" />
            </Card.Content>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="Ще немає жодного відгуку"
        description="Відгуки зі сторінки зворотного звʼязку зʼявляться тут."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const who = item.contactName || item.guest?.name;
        const phone = item.contactPhone || item.guest?.phone;
        return (
          <Card key={item.id}>
            <Card.Content className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-foreground">{who ?? "Анонімний гість"}</strong>
                  {item.guest?.telegramUsername && (
                    <span className="text-sm text-muted">@{item.guest.telegramUsername}</span>
                  )}
                  {phone && <span className="text-sm text-muted">{phone}</span>}
                </div>
                <span className="text-xs text-muted">{new Date(item.createdAt).toLocaleString("uk-UA")}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-2">
                  <RatingChip label="Страви" value={item.dishesRating} />
                  <Stars value={item.dishesRating} />
                </span>
                <span className="flex items-center gap-2">
                  <RatingChip label="Сервіс" value={item.serviceRating} />
                  <Stars value={item.serviceRating} />
                </span>
              </div>

              {item.comment && <p className="text-sm text-foreground">{item.comment}</p>}
            </Card.Content>
          </Card>
        );
      })}
    </div>
  );
}
