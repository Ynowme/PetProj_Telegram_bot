import type { PosProvider } from "@/lib/pos/provider";
import { sharedDbPosProvider } from "@/lib/pos/shared-db-provider";

// Реальний провайдер — CastaPOS (окремий репозиторій, стан приходить push-вебхуками, не спільною
// БД), див. lib/pos/shared-db-provider.ts. fakePosProvider лишається лише для юніт-тестів.
export const posProvider: PosProvider = sharedDbPosProvider;
