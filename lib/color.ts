// Чисті функції для похідних відтінків акцентного кольору теми (SiteContent.accentColor,
// заповнюється з CastaPOS-адмінки) — без залежностей, легко юніт-тестувати. Використовується в
// app/layout.tsx, щоб вивести --accent-bright/--accent-muted/--accent-contrast з одного hex,
// заданого власником, замість вимагати від нього чотири узгоджені кольори вручну.

export type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function toHexChannel(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

// Лінійна інтерполяція каналів у бік target на частку ratio (0 = hex як є, 1 = чистий target).
// Невалідний hex повертається як є — виклики самі вирішують, чи це прийнятний фолбек.
export function mix(hex: string, target: Rgb, ratio: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex({
    r: rgb.r + (target.r - rgb.r) * ratio,
    g: rgb.g + (target.g - rgb.g) * ratio,
    b: rgb.b + (target.b - rgb.b) * ratio,
  });
}

export function lighten(hex: string, ratio = 0.3): string {
  return mix(hex, WHITE, ratio);
}

export function darken(hex: string, ratio = 0.35): string {
  return mix(hex, BLACK, ratio);
}

// Відносна яскравість за спрощеною ITU-R BT.709-вагою каналів (без гамма-корекції) — досить,
// щоб вибрати між чорним і білим текстом поверх суцільної заливки кольором, не претендує на
// точний WCAG-контраст-рейтинг.
function relativeLuminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function contrastTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  return relativeLuminance(rgb) > 0.55 ? "#000000" : "#ffffff";
}

export type AccentTheme = { accent: string; accentBright: string; accentMuted: string; accentContrast: string };

// null для невалідного hex (напр. якщо в БД опиниться сирий текст) — виклик тоді просто не
// застосовує тему, лишає дефолтну палітру з app/globals.css, а не падає й не рендерить "null".
export function deriveAccentTheme(hex: string): AccentTheme | null {
  if (!hexToRgb(hex)) return null;
  return {
    accent: hex,
    accentBright: lighten(hex),
    accentMuted: darken(hex, 0.2),
    accentContrast: contrastTextColor(hex),
  };
}
