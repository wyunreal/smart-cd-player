import fs from "fs";
import path from "path";

const defaultImagesPath = path.join(process.cwd(), "..", "data", "images");
export const FILES_DIR = process.env.IMAGES_DIR || defaultImagesPath;

/**
 * Downloads an image from a URL and saves it to the {projectDir}/../data/images folder
 * @param imageUrl - The URL of the image to download
 * @param fileName - The name to save the downloaded image as
 * @returns The local file path of the downloaded image
 * @throws Will throw an error if the download fails
 */
export const downloadImage = async (
  imageUrl: string,
  fileName: string,
): Promise<string> => {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
  console.log("Downloading image from URL:", imageUrl);
  const filePath = path.join(FILES_DIR, fileName);

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (error) {
    throw new Error(
      `Error downloading image: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};

/**
 * Saves image binary content to the {projectDir}/../data/images folder
 */
export const saveImage = async (
  imageBuffer: Buffer | ArrayBuffer,
  fileName: string,
): Promise<string> => {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }

  const filePath = path.join(FILES_DIR, fileName);
  const buffer = Buffer.isBuffer(imageBuffer)
    ? imageBuffer
    : Buffer.from(imageBuffer);

  fs.writeFileSync(filePath, buffer);

  return filePath;
};
