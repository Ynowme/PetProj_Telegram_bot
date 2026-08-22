import { Skeleton } from "@heroui/react";

// Skeleton повторює форму сторінки бонусів: hero-метрика балансу і список операцій.
export default function BonusesLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="mt-3 h-9 w-40 rounded-lg" />
      <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-md rounded" />
      <Skeleton className="mt-8 h-6 w-44 rounded" />
      <div className="mt-3 grid gap-px overflow-hidden rounded-2xl">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-none first:rounded-t-2xl last:rounded-b-2xl" />
        ))}
      </div>
    </main>
  );
}
