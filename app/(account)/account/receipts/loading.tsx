import { Skeleton } from "@heroui/react";

// Skeleton повторює форму історії чеків: заголовок, підпис і рядки-картки чеків.
export default function ReceiptsLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="mt-3 h-9 w-52 rounded-lg" />
      <Skeleton className="mt-2 h-4 w-36 rounded" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
