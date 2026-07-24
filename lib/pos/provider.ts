// Абстрактный интерфейс POS-провайдера (specs/002-member-gold-system, Промт 4).
// Реальный SkyServiceProvider появится только после официальной API/webhook-документации
// от SkyService — до тех пор используется fakePosProvider (см. fake-provider.ts).
export interface PosProvider {
  /** Проверяет на стороне POS, что стол с этим публичным кодом сейчас открыт. */
  isTableOpen(tableCode: string): Promise<{ open: boolean; posTableExternalId?: string }>;
  /** Реестр всех столов бара с текущим статусом (для бронювання столу, Промт: Послуги). */
  listTables(): Promise<{ tableCode: string; open: boolean }[]>;
}
