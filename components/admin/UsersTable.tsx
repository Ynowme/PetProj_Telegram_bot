"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SortDescriptor } from "react-aria-components/Table";
import { Chip, Pagination, SearchField, Table } from "@heroui/react";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { UserRoleChip } from "@/components/admin/UserRoleChip";

export type UserRow = {
  id: string;
  name: string;
  telegramUsername: string | null;
  phone: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  receiptsCount: number;
  bonusBalance: number;
};

const PAGE_SIZE = 15;

// Сторінки пагінації з еліпсисами: показуємо краї та вікно навколо поточної,
// щоб при великій кількості гостей ряд номерів не розтягувався на весь екран.
function pageNumbers(totalPages: number, current: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

export function UsersTable({ rows }: { rows: UserRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  const [page, setPage] = useState(1);

  // Клієнтський пошук по вже завантажених рядках: імʼя, username, телефон
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        (row.telegramUsername ?? "").toLowerCase().includes(query) ||
        (row.phone ?? "").toLowerCase().includes(query),
    );
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    if (!sort) return visibleRows;
    const dir: 1 | -1 = sort.direction === "descending" ? -1 : 1;
    return [...visibleRows].sort((a, b) => {
      switch (sort.column) {
        case "name":
          return dir * a.name.localeCompare(b.name, "uk");
        case "createdAt":
          return dir * (Date.parse(a.createdAt) - Date.parse(b.createdAt));
        case "receipts":
          return dir * (a.receiptsCount - b.receiptsCount);
        case "bonuses":
          return dir * (a.bonusBalance - b.bonusBalance);
        default:
          return 0;
      }
    });
  }, [visibleRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  // Пошук чи сортування можуть лишити поточну сторінку за межами списку — тримаємо її в межах
  const currentPage = Math.min(page, totalPages);
  const pagedRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const moneyHeader = "text-right";
  const moneyCell = "text-right tabular-nums";

  return (
    <div className="grid gap-3">
      <SearchField value={search} onChange={changeSearch} aria-label="Пошук гостя" className="max-w-sm">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Імʼя, @username або телефон" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {pagedRows.length === 0 ? (
        <AdminEmptyState
          title={rows.length === 0 ? "Ще ніхто не входив через Telegram" : "Нічого не знайдено за пошуком"}
          description={
            rows.length === 0 ? "Гості зʼявляться тут після першого входу." : "Спробуйте інший пошуковий запит."
          }
        />
      ) : (
        <Table>
          {/* Обмежена висота + липкі th: шапка лишається видимою при прокрутці списку гостей */}
          <Table.ScrollContainer className="max-h-[65vh] [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-surface">
            <Table.Content
              aria-label="Гості"
              sortDescriptor={sort ?? undefined}
              onSortChange={(descriptor) => setSort(descriptor)}
            >
              <Table.Header>
                <Table.Column id="name" isRowHeader allowsSorting>
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>Гість</Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column>Телефон</Table.Column>
                <Table.Column>Роль</Table.Column>
                <Table.Column id="createdAt" allowsSorting>
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>Реєстрація</Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column id="receipts" allowsSorting className={moneyHeader}>
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>Чеки</Table.SortableColumnHeader>
                  )}
                </Table.Column>
                <Table.Column id="bonuses" allowsSorting className={moneyHeader}>
                  {({ sortDirection }) => (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>Бонуси</Table.SortableColumnHeader>
                  )}
                </Table.Column>
              </Table.Header>
              <Table.Body>
                {pagedRows.map((row) => (
                  <Table.Row
                    key={row.id}
                    id={row.id}
                    onAction={() => router.push(`/admin/users/${row.id}`)}
                    className="cursor-pointer"
                  >
                    <Table.Cell>
                      <div className="grid gap-0.5">
                        <span className="flex items-center gap-2 text-foreground">
                          {row.name}
                          {row.isAdmin && (
                            <Chip color="accent" variant="soft" size="sm">
                              адмін
                            </Chip>
                          )}
                        </span>
                        {row.telegramUsername ? (
                          <span className="text-xs text-muted">@{row.telegramUsername}</span>
                        ) : (
                          <span className="text-xs text-muted">без Telegram username</span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{row.phone ?? <span className="text-muted">немає</span>}</Table.Cell>
                    <Table.Cell>
                      <UserRoleChip role={row.role} />
                    </Table.Cell>
                    <Table.Cell>{new Intl.DateTimeFormat("uk-UA").format(new Date(row.createdAt))}</Table.Cell>
                    <Table.Cell className={moneyCell}>{row.receiptsCount}</Table.Cell>
                    <Table.Cell className={moneyCell}>{row.bonusBalance} ₴</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {totalPages > 1 && (
        <Pagination aria-label="Сторінки списку гостей" className="justify-self-center">
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={currentPage === 1}
                onPress={() => setPage(currentPage - 1)}
                aria-label="Попередня сторінка"
              >
                <Pagination.PreviousIcon />
              </Pagination.Previous>
            </Pagination.Item>
            {pageNumbers(totalPages, currentPage).map((item, index) =>
              item === "ellipsis" ? (
                <Pagination.Item key={`ellipsis-${index}`}>
                  <Pagination.Ellipsis />
                </Pagination.Item>
              ) : (
                <Pagination.Item key={item}>
                  <Pagination.Link isActive={item === currentPage} onPress={() => setPage(item)}>
                    {item}
                  </Pagination.Link>
                </Pagination.Item>
              ),
            )}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={currentPage === totalPages}
                onPress={() => setPage(currentPage + 1)}
                aria-label="Наступна сторінка"
              >
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      )}
    </div>
  );
}
