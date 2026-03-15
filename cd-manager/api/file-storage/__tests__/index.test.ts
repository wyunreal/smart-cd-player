import fs from "fs";
import path from "path";
import os from "os";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

let testDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "filestorage-test-"));
  process.env.IMAGES_DIR = testDir;
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
  delete process.env.IMAGES_DIR;
});

// Must import after setting env
// Use require to ensure env is set before module loads
let downloadImage: typeof import("../index").downloadImage;
let saveImage: typeof import("../index").saveImage;
let FILES_DIR: string;

beforeAll(async () => {
  // Clear module cache to pick up the new IMAGES_DIR
  jest.resetModules();
  const mod = await import("../index");
  downloadImage = mod.downloadImage;
  saveImage = mod.saveImage;
  FILES_DIR = mod.FILES_DIR;
});

describe("file-storage", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("downloadImage", () => {
    it("downloads and saves an image from a valid URL", async () => {
      const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const arrayBuffer = imageData.buffer.slice(
        imageData.byteOffset,
        imageData.byteOffset + imageData.byteLength,
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: async () => arrayBuffer,
      });

      const result = await downloadImage(
        "https://i.discogs.com/test-image.jpg",
        "downloaded.jpg",
      );

      expect(result).toBe(path.join(testDir, "downloaded.jpg"));
      expect(fs.existsSync(result)).toBe(true);
      const saved = fs.readFileSync(result);
      expect(saved[0]).toBe(0xff);
      expect(saved[1]).toBe(0xd8);
      expect(saved.length).toBe(4);
    });

    it("throws when fetch returns non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(
        downloadImage("https://i.discogs.com/notfound.jpg", "fail.jpg"),
      ).rejects.toThrow("Failed to download image");
    });

    it("throws when fetch rejects with network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(
        downloadImage("https://i.discogs.com/error.jpg", "fail.jpg"),
      ).rejects.toThrow("Error downloading image");
    });

    it("creates the images directory if it does not exist", async () => {
      // Use a nested dir that doesn't exist
      const nestedDir = path.join(testDir, "subdir-download");
      process.env.IMAGES_DIR = nestedDir;
      jest.resetModules();
      const mod = await import("../index");

      const imageData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ "content-type": "image/png" }),
        arrayBuffer: async () => imageData.buffer.slice(0),
      });

      const result = await mod.downloadImage(
        "https://i.discogs.com/test.png",
        "created-dir.png",
      );

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.existsSync(result)).toBe(true);

      // Restore
      process.env.IMAGES_DIR = testDir;
    });
  });

  describe("saveImage", () => {
    it("saves a buffer to disk", async () => {
      const imageData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

      const result = await saveImage(imageData, "saved.jpg");

      expect(result).toBe(path.join(testDir, "saved.jpg"));
      expect(fs.existsSync(result)).toBe(true);
      expect(fs.readFileSync(result)).toEqual(imageData);
    });

    it("saves an ArrayBuffer to disk", async () => {
      const data = new Uint8Array([0x05, 0x06, 0x07, 0x08]);

      const result = await saveImage(data.buffer as ArrayBuffer, "saved-ab.jpg");

      expect(result).toBe(path.join(testDir, "saved-ab.jpg"));
      expect(fs.existsSync(result)).toBe(true);
    });

    it("creates the images directory if it does not exist", async () => {
      const nestedDir = path.join(testDir, "subdir-save");
      process.env.IMAGES_DIR = nestedDir;
      jest.resetModules();
      const mod = await import("../index");

      const result = await mod.saveImage(
        Buffer.from([0x01]),
        "created-dir.jpg",
      );

      expect(fs.existsSync(nestedDir)).toBe(true);
      expect(fs.existsSync(result)).toBe(true);

      // Restore
      process.env.IMAGES_DIR = testDir;
    });
  });
});
