import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Интерфейс хранения изображений (фото позиций меню, баннеры акций).
// research.md, п.6: локальный диск на старте, с возможностью позже перейти
// на S3-совместимое хранилище без изменения вызывающего кода.

export interface ImageStorage {
  /** Сохраняет файл и возвращает публичный URL для использования в БД (MenuItem.photoUrl и т.п.). */
  save(fileName: string, data: Buffer): Promise<string>;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "menu");

class LocalDiskImageStorage implements ImageStorage {
  async save(fileName: string, data: Buffer): Promise<string> {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const ext = path.extname(fileName) || ".jpg";
    const uniqueName = `${randomUUID()}${ext}`;
    await writeFile(path.join(UPLOADS_DIR, uniqueName), data);

    return `/uploads/menu/${uniqueName}`;
  }
}

export const imageStorage: ImageStorage = new LocalDiskImageStorage();
