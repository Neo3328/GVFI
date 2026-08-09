/**
 * GVFI — Background image accept / load helpers (PNG-safe).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

/** Picker accept — extension + MIME; PNG first for Windows empty-type files */
export const IMAGE_FILE_ACCEPT =
  ".png,.PNG,image/png,image/x-png,.jpg,.JPG,.jpeg,.JPEG,.jpe,image/jpeg,.webp,.WEBP,image/webp";

const IMAGE_EXT = /\.(png|jpe?g|jpe|webp)$/i;

const IMAGE_MIME = new Set([
  "image/png",
  "image/x-png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
]);

/** Raw file size ceiling before decode (base64 persist needs headroom under ~5MB quota). */
export const MAX_BACKGROUND_FILE_BYTES = 6 * 1024 * 1024;

/** Persistable data-URL length ceiling (localStorage typically ~5MB). */
export const MAX_BACKGROUND_DATA_URL_CHARS = 3_200_000;

export type BackgroundImageLoadErrorCode =
  | "unsupported"
  | "tooLarge"
  | "readFail"
  | "decodeFail"
  | "persistFail";

export class BackgroundImageLoadError extends Error {
  readonly code: BackgroundImageLoadErrorCode;
  constructor(code: BackgroundImageLoadErrorCode, message?: string) {
    super(message ?? code);
    this.name = "BackgroundImageLoadError";
    this.code = code;
  }
}

export interface LoadedBackgroundImage {
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
  mime: string;
}

/** Accept PNG/JPEG/WebP even when Electron/Windows leaves `file.type` empty */
export function isAcceptedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase().trim();
  if (mime && IMAGE_MIME.has(mime)) return true;
  if (mime.startsWith("image/") && !mime.includes("svg")) {
    /* Allow generic image/* only when extension also matches our allow-list */
    return IMAGE_EXT.test(file.name);
  }
  return IMAGE_EXT.test(file.name);
}

export function isPngImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  if (mime === "image/png" || mime === "image/x-png") return true;
  return /\.png$/i.test(file.name);
}

function detectMimeFromBytes(bytes: Uint8Array, fileName: string): string | null {
  if (bytes.length >= 8) {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }
  }
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (/\.jpe?g$/.test(lower) || lower.endsWith(".jpe")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new BackgroundImageLoadError("decodeFail"));
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new BackgroundImageLoadError("readFail"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new BackgroundImageLoadError("readFail"));
    reader.readAsDataURL(blob);
  });
}

function normalizeDataUrlMime(dataUrl: string, mime: string): string {
  if (dataUrl.startsWith(`data:${mime}`)) return dataUrl;
  if (
    dataUrl.startsWith("data:application/octet-stream") ||
    dataUrl.startsWith("data:;base64,") ||
    dataUrl.startsWith("data:base64,")
  ) {
    return dataUrl.replace(/^data:[^;,]*/, `data:${mime}`);
  }
  return dataUrl;
}

/**
 * Reliable pipeline: validate → magic MIME → object URL decode → data URL.
 * Revokes object URL only after the image has loaded successfully.
 */
export async function loadBackgroundImageFile(
  file: File
): Promise<LoadedBackgroundImage> {
  if (!isAcceptedImageFile(file)) {
    throw new BackgroundImageLoadError("unsupported");
  }
  if (file.size <= 0) {
    throw new BackgroundImageLoadError("readFail");
  }
  if (file.size > MAX_BACKGROUND_FILE_BYTES) {
    throw new BackgroundImageLoadError("tooLarge");
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    throw new BackgroundImageLoadError("readFail");
  }

  const bytes = new Uint8Array(buffer);
  const mime =
    detectMimeFromBytes(bytes, file.name) ||
    (file.type && IMAGE_MIME.has(file.type.toLowerCase())
      ? file.type.toLowerCase()
      : null);
  if (!mime) {
    throw new BackgroundImageLoadError("unsupported");
  }

  const blob = new Blob([buffer], { type: mime });
  const objectUrl = URL.createObjectURL(blob);
  let width = 0;
  let height = 0;
  try {
    const img = await loadHtmlImage(objectUrl);
    width = img.naturalWidth;
    height = img.naturalHeight;
    if (!width || !height) {
      throw new BackgroundImageLoadError("decodeFail");
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  let dataUrl = normalizeDataUrlMime(await blobToDataUrl(blob), mime);
  if (dataUrl.length > MAX_BACKGROUND_DATA_URL_CHARS) {
    /* Downscale JPEG/WebP; keep PNG via canvas PNG if still oversized → error */
    dataUrl = await compressToPersistableDataUrl(blob, mime, width, height);
  }

  if (dataUrl.length > MAX_BACKGROUND_DATA_URL_CHARS) {
    throw new BackgroundImageLoadError("tooLarge");
  }

  return {
    dataUrl,
    fileName: file.name,
    width,
    height,
    mime,
  };
}

async function compressToPersistableDataUrl(
  blob: Blob,
  mime: string,
  width: number,
  height: number
): Promise<string> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadHtmlImage(objectUrl);
    const maxEdge = 1920;
    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new BackgroundImageLoadError("decodeFail");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const exportMime = mime === "image/png" ? "image/png" : "image/jpeg";
    const quality = exportMime === "image/jpeg" ? 0.82 : undefined;
    const out = canvas.toDataURL(exportMime, quality);
    return out;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
