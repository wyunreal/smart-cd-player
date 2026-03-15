/**
 * @jest-environment node
 */

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

let downloadImage: typeof import("../index").downloadImage;
let saveImage: typeof import("../index").saveImage;

beforeAll(async () => {
  jest.resetModules();
  const mod = await import("../index");
  downloadImage = mod.downloadImage;
  saveImage = mod.saveImage;
});

describe("file-storage", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe("downloadImage", () => {
    it("downloads and saves an image from a valid allowed URL", async () => {
      const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const arrayBuffer = imageData.buffer.slice(
        imageData.byteOffset,
        imageData.byteOffset + imageData.byteLength,
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-type": "image/jpeg",
          "content-length": "4",
        }),
        arrayBuffer: async () => arrayBuffer,
      });

      const result = await downloadImage(
        "https://i.discogs.com/test-image.jpg",
        "downloaded.jpg",
      );

      expect(result).toContain("downloaded.jpg");
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
      ).rejects.toThrow();
    });

    it("throws when fetch rejects with network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      await expect(
        downloadImage("https://i.discogs.com/error.jpg", "fail.jpg"),
      ).rejects.toThrow();
    });

    // --- NEW: URL validation tests ---

    it("rejects URLs from non-allowed origins", async () => {
      await expect(
        downloadImage("https://evil.com/malware.exe", "bad.exe"),
      ).rejects.toThrow("not allowed");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects non-https URLs", async () => {
      await expect(
        downloadImage("http://i.discogs.com/image.jpg", "bad.jpg"),
      ).rejects.toThrow("not allowed");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    // --- NEW: Content-type validation tests ---

    it("rejects responses with non-image content-type", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-type": "text/html",
          "content-length": "100",
        }),
        arrayBuffer: async () => new ArrayBuffer(100),
      });

      await expect(
        downloadImage("https://i.discogs.com/page.html", "page.html"),
      ).rejects.toThrow("image");
    });

    // --- NEW: Size limit tests ---

    it("rejects responses that exceed the size limit via content-length", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-type": "image/jpeg",
          "content-length": String(20 * 1024 * 1024), // 20MB
        }),
        arrayBuffer: async () => new ArrayBuffer(0),
      });

      await expect(
        downloadImage("https://i.discogs.com/huge.jpg", "huge.jpg"),
      ).rejects.toThrow("size");
    });

    // --- NEW: Filename sanitization tests ---

    it("sanitizes filenames with path traversal sequences", async () => {
      const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          "content-type": "image/jpeg",
          "content-length": "4",
        }),
        arrayBuffer: async () =>
          imageData.buffer.slice(
            imageData.byteOffset,
            imageData.byteOffset + imageData.byteLength,
          ),
      });

      const result = await downloadImage(
        "https://i.discogs.com/image.jpg",
        "../../etc/evil.jpg",
      );

      // The file should be saved inside testDir, not escaped
      expect(path.dirname(result)).toBe(testDir);
      // The saved file should exist
      expect(fs.existsSync(result)).toBe(true);
    });
  });

  describe("saveImage", () => {
    it("saves a buffer to disk", async () => {
      const imageData = Buffer.from([0x01, 0x02, 0x03, 0x04]);

      const result = await saveImage(imageData, "saved.jpg");

      expect(result).toContain("saved.jpg");
      expect(fs.existsSync(result)).toBe(true);
      expect(fs.readFileSync(result)).toEqual(imageData);
    });

    it("saves an ArrayBuffer to disk", async () => {
      const data = new Uint8Array([0x05, 0x06, 0x07, 0x08]);

      const result = await saveImage(
        data.buffer as ArrayBuffer,
        "saved-ab.jpg",
      );

      expect(result).toContain("saved-ab.jpg");
      expect(fs.existsSync(result)).toBe(true);
    });

    // --- NEW: saveImage sanitization test ---

    it("sanitizes filenames with path traversal sequences", async () => {
      const imageData = Buffer.from([0x01, 0x02]);

      const result = await saveImage(imageData, "../../../etc/evil.jpg");

      // Should be saved inside testDir, not escaped
      expect(path.dirname(result)).toBe(testDir);
    });
  });
});
