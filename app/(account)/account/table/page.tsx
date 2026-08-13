"use client";

import Link from "next/link";
import { TableLinkPanel } from "@/components/TableLinkPanel";

export default function TablePage() {
  return (
    <main className="page page--narrow">
      <Link href="/account" className="back-link">
        ← Кабінет
      </Link>
      <TableLinkPanel />
    </main>
  );
}
