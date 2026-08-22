"use client";

import { Chip } from "@heroui/react";

const ROLE_LABEL: Record<string, string> = {
  MEMBER: "Member",
  GOLD_MEMBER: "Gold Member",
};

// GOLD_MEMBER підсвічений warning-кольором ("золотий" статус лояльності),
// звичайний MEMBER — нейтральний, щоб не змагатися за увагу.
export function UserRoleChip({ role }: { role: string }) {
  return (
    <Chip color={role === "GOLD_MEMBER" ? "warning" : "default"} variant="soft" size="sm">
      {ROLE_LABEL[role] ?? role}
    </Chip>
  );
}
