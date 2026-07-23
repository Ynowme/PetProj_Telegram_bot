import { loadEnvFile } from "node:process";

// Vitest, на відміну від Next.js, не підвантажує .env автоматично.
try {
  loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  // .env відсутній (наприклад, у CI зі своїми змінними оточення) — це нормально.
}
