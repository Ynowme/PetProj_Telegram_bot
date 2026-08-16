import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGuestOrderRequest, getPendingOrderRequestsForTable, resolveGuestOrderRequest, GuestOrderError } from "@/lib/guest-orders";

// Реальна локальна Postgres, той самий патерн, що tests/integration/menu-sync.test.ts —
// create-then-cleanup за рандомізованими id, без моків.
describe("guest order requests", () => {
  let userId: string;
  let categoryId: string;
  let orderableItemId: string;
  let notOrderableItemId: string;
  let tableCode: string;
  let tableSessionId: string;
  let runId: string;

  async function setup(sessionStatus: "CONFIRMED" | "PENDING_STAFF_CONFIRMATION" = "CONFIRMED") {
    const run = Math.random().toString(36).slice(2);
    runId = run;
    const user = await prisma.user.create({ data: { name: `guest-${run}`, phone: `+380${run}` } });
    userId = user.id;

    const category = await prisma.menuCategory.create({ data: { name: `cat-${run}`, slug: `cat-${run}`, order: 0 } });
    categoryId = category.id;

    const orderableItem = await prisma.menuItem.create({
      data: { name: `Лате ${run}`, price: 75, categoryId, posExternalId: `ext-${run}`, kind: "product" },
    });
    orderableItemId = orderableItem.id;

    const notOrderableItem = await prisma.menuItem.create({ data: { name: `Legacy ${run}`, price: 50, categoryId } });
    notOrderableItemId = notOrderableItem.id;

    tableCode = `table-${run}`;
    const tableSession = await prisma.tableSession.create({
      data: { tableCode, userId, status: sessionStatus, confirmedAt: sessionStatus === "CONFIRMED" ? new Date() : null },
    });
    tableSessionId = tableSession.id;
  }

  afterEach(async () => {
    await prisma.guestOrderRequestItem.deleteMany({ where: { request: { tableSessionId } } });
    await prisma.guestOrderRequest.deleteMany({ where: { tableSessionId } });
    await prisma.tableSession.deleteMany({ where: { id: tableSessionId } });
    await prisma.menuItem.deleteMany({ where: { categoryId } });
    await prisma.menuCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("creates a request with a name/price snapshot", async () => {
    await setup();
    const request = await createGuestOrderRequest(userId, [{ menuItemId: orderableItemId, quantity: 2 }]);

    expect(request.status).toBe("PENDING");
    expect(request.items).toHaveLength(1);
    expect(request.items[0].name).toBe(`Лате ${runId}`);
    expect(Number(request.items[0].price)).toBe(75);
    expect(request.items[0].quantity).toBe(2);
  });

  it("rejects an empty cart", async () => {
    await setup();
    await expect(createGuestOrderRequest(userId, [])).rejects.toMatchObject({ code: "EMPTY_CART" });
  });

  it("rejects when the guest has no CONFIRMED table session", async () => {
    await setup("PENDING_STAFF_CONFIRMATION");
    await expect(createGuestOrderRequest(userId, [{ menuItemId: orderableItemId, quantity: 1 }])).rejects.toMatchObject({
      code: "NO_ACTIVE_TABLE_SESSION",
    });
  });

  it("rejects a menu item without posExternalId/kind (not resolvable by the POS)", async () => {
    await setup();
    await expect(createGuestOrderRequest(userId, [{ menuItemId: notOrderableItemId, quantity: 1 }])).rejects.toMatchObject({
      code: "MENU_ITEM_NOT_ORDERABLE",
    });
  });

  it("rejects a dangling menu item id", async () => {
    await setup();
    await expect(createGuestOrderRequest(userId, [{ menuItemId: "does-not-exist", quantity: 1 }])).rejects.toMatchObject({
      code: "MENU_ITEM_NOT_FOUND",
    });
  });

  it("getPendingOrderRequestsForTable returns only PENDING requests for a CONFIRMED session on that table", async () => {
    await setup();
    const request = await createGuestOrderRequest(userId, [{ menuItemId: orderableItemId, quantity: 1 }]);

    const pending = await getPendingOrderRequestsForTable(tableCode);
    expect(pending.map((r) => r.id)).toContain(request.id);
    expect(pending[0].items[0].menuItem.posExternalId).toBe(`ext-${runId}`);
    expect(pending[0].items[0].menuItem.kind).toBe("product");

    const otherTablePending = await getPendingOrderRequestsForTable("no-such-table");
    expect(otherTablePending).toHaveLength(0);
  });

  it("resolveGuestOrderRequest is idempotent and marks resolvedAt", async () => {
    await setup();
    const request = await createGuestOrderRequest(userId, [{ menuItemId: orderableItemId, quantity: 1 }]);

    await resolveGuestOrderRequest(request.id, "IMPORTED");
    const resolved = await prisma.guestOrderRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(resolved.status).toBe("IMPORTED");
    expect(resolved.resolvedAt).not.toBeNull();

    // Другий виклик (ретрай доставки з боку каси) не повинен перезаписати вже вирішену заявку.
    await resolveGuestOrderRequest(request.id, "REJECTED");
    const stillImported = await prisma.guestOrderRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(stillImported.status).toBe("IMPORTED");

    const pendingAfterResolve = await getPendingOrderRequestsForTable(tableCode);
    expect(pendingAfterResolve.map((r) => r.id)).not.toContain(request.id);
  });
});
