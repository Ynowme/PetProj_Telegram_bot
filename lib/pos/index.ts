import type { PosProvider } from "@/lib/pos/provider";
import { fakePosProvider } from "@/lib/pos/fake-provider";

// TODO(SkyService): подменить на SkyServiceProvider после получения официальной
// API/webhook-документации, тестовых ключей и примеров payload от владельца (Промт 4).
export const posProvider: PosProvider = fakePosProvider;
