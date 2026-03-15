/**
 * @jest-environment node
 */

import fs from "fs";
import path from "path";
import os from "os";
import { NextRequest } from "next/server";

// We need to mock FILES_DIR before importing the route
let testDir: string;

beforeAll(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "images-test-"));
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

// Mock the file-storage module to use our temp directory
jest.mock("@/api/file-storage", () => ({
  get FILES_DIR() {
    return testDir;
  },
}));

// Import after mocking
import { GET } from "../route";

const createRequest = (filename: string): NextRequest => {
  return new NextRequest(
    new URL(`/api/images/${filename}`, "http://localhost:3000"),
  );
};

describe("images route", () => {
  it("returns 404 when image does not exist", async () => {
    const req = createRequest("nonexistent.jpg");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "nonexistent.jpg" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Image not found");
  });

  it("serves an existing image with correct content-type", async () => {
    // Create a test image file
    const testFile = path.join(testDir, "test.jpg");
    fs.writeFileSync(testFile, Buffer.from([0xff, 0xd8, 0xff, 0xe0])); // JPEG magic bytes

    const req = createRequest("test.jpg");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "test.jpg" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/jpeg");
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(res.headers.get("ETag")).toBeDefined();
    expect(res.headers.get("Last-Modified")).toBeDefined();
  });

  it("serves PNG with correct content-type", async () => {
    const testFile = path.join(testDir, "test.png");
    fs.writeFileSync(testFile, Buffer.from([0x89, 0x50, 0x4e, 0x47]));

    const req = createRequest("test.png");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "test.png" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("serves WebP with correct content-type", async () => {
    const testFile = path.join(testDir, "test.webp");
    fs.writeFileSync(testFile, Buffer.from([0x52, 0x49, 0x46, 0x46]));

    const req = createRequest("test.webp");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "test.webp" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
  });

  it("uses application/octet-stream for unknown extensions", async () => {
    const testFile = path.join(testDir, "test.xyz");
    fs.writeFileSync(testFile, Buffer.from([0x00, 0x01]));

    const req = createRequest("test.xyz");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "test.xyz" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("returns correct body content", async () => {
    const content = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    const testFile = path.join(testDir, "body-test.jpg");
    fs.writeFileSync(testFile, content);

    const req = createRequest("body-test.jpg");
    const res = await GET(req, {
      params: Promise.resolve({ filename: "body-test.jpg" }),
    });

    const body = await res.arrayBuffer();
    expect(Buffer.from(body)).toEqual(content);
  });
});
