import type { PosProvider } from "@/lib/pos/provider";

// In-memory реестр "открытых столов" для локальной разработки и тестов (Промт 4).
// Состояние живёт в рамках одного процесса Node — этого достаточно для fake-провайдера,
// который никогда не используется в production.
const openTables = new Map<string, string>(); // tableCode -> posTableExternalId

export const fakePosProvider: PosProvider = {
  async isTableOpen(tableCode: string) {
    const posTableExternalId = openTables.get(tableCode);
    return posTableExternalId ? { open: true, posTableExternalId } : { open: false };
  },
};

/** Тестовая утилита: "открыть" стол в fake POS. Не использовать вне тестов/дев-сценариев. */
export function fakePosOpenTable(tableCode: string, posTableExternalId = `fake-${tableCode}`): void {
  openTables.set(tableCode, posTableExternalId);
}

/** Тестовая утилита: "закрыть" стол в fake POS. */
export function fakePosCloseTable(tableCode: string): void {
  openTables.delete(tableCode);
}

/** Тестовая утилита: сбросить состояние fake POS между тестами. */
export function fakePosReset(): void {
  openTables.clear();
}
