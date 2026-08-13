// Транслітерація укр./рос. кирилиці в латиницю для slug'ів MenuCategory — винесено зі
// scripts/import-menu.ts, щоб lib/menu-sync.ts (CastaPOS -> сайт) міг переюзати ту саму логіку
// замість дублювання таблиці транслітерації.
const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ъ: "",
};

export function slugify(input: string): string {
  const transliterated = [...input.toLowerCase()].map((char) => TRANSLIT[char] ?? char).join("");
  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
