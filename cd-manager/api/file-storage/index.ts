import fs from "fs";
import path from "path";
import {
  isAllowedImageUrl,
  sanitizeFilename,
  isPathWithinDir,
} from "@/lib/security";

const defaultImagesPath = path.join(process.cwd(), "..", "data", "images");
export const FILES_DIR = process.env.IMAGES_DIR || defaultImagesPath;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * Downloads an image from a URL and saves it to the images folder.
 * Validates: URL allowlist, content-type, file size, and filename.
 */
export const downloadImage = async (
  imageUrl: string,
  fileName: string,
): Promise<string> => {
  if (!isAllowedImageUrl(imageUrl)) {
    throw new Error("Image URL not allowed");
  }

  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }

  const safeFileName = sanitizeFilename(fileName);
  const filePath = path.join(FILES_DIR, safeFileName);

  if (!isPathWithinDir(filePath, FILES_DIR)) {
    throw new Error("Invalid filename");
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!ALLOWED_IMAGE_CONTENT_TYPES.some((t) => contentType.startsWith(t))) {
      throw new Error("Response is not a valid image type");
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
      throw new Error("Image exceeds maximum allowed size");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new Error("Image exceeds maximum allowed size");
    }

    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error(
      `Error downloading image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Saves image binary content to the images folder.
 * Validates: filename sanitization and path containment.
 */
export const saveImage = async (
  imageBuffer: Buffer | ArrayBuffer,
  fileName: string,
): Promise<string> => {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }

  const safeFileName = sanitizeFilename(fileName);
  const filePath = path.join(FILES_DIR, safeFileName);

  if (!isPathWithinDir(filePath, FILES_DIR)) {
    throw new Error("Invalid filename");
  }

  const buffer = Buffer.isBuffer(imageBuffer)
    ? imageBuffer
    : Buffer.from(imageBuffer);

  fs.writeFileSync(filePath, buffer);

  return filePath;
};
