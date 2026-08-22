import { Skeleton } from "@heroui/react";

// Skeleton повторює форму огляду кабінету: заголовок зі статус-чипом і сітка розділів.
export default function AccountLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[74px] w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}
