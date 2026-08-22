"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouterProvider, Toast } from "@heroui/react";

// Той самий патерн, що в CastaPOS: RouterProvider зшиває HeroUI-компоненти з
// next/navigation (client-side переходи), Toast.Provider — єдиний глобальний
// регіон сповіщень (toast.success()/toast.danger() з "@heroui/react").
export function HeroUIProviders({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <RouterProvider navigate={router.push}>
      <Toast.Provider placement="top" maxVisibleToasts={3} />
      {children}
    </RouterProvider>
  );
}
