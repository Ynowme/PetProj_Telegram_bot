import type { PosProvider } from "@/lib/pos/provider";
import { sharedDbPosProvider } from "@/lib/pos/shared-db-provider";

// Реальний провайдер — CastaPOS (окремий репозиторій, спільна Neon-база), див.
// lib/pos/shared-db-provider.ts. fakePosProvider лишається лише для юніт-тестів.
export const posProvider: PosProvider = sharedDbPosProvider;
