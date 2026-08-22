"use client";

import { TableLinkPanel } from "@/components/TableLinkPanel";
import { BackLink } from "@/components/account/BackLink";

export default function TablePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <BackLink href="/account">Кабінет</BackLink>
      <div className="mt-4">
        <TableLinkPanel />
      </div>
    </main>
  );
}
