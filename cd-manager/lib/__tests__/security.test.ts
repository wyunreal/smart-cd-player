/**
 * @jest-environment node
 */

import path from "path";

// Save original env
const originalEnv = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

const loadModule = async () => {
  return import("../security");
};

describe("isAllowedProxyUrl", () => {
  it("allows a URL whose origin matches COMPOSITE_VIDEO_PARSER_URL", async () => {
    process.env.COMPOSITE_VIDEO_PARSER_URL = "http://192.168.1.50:8080";
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("http://192.168.1.50:8080/display")).toBe(true);
    expect(isAllowedProxyUrl("http://192.168.1.50:8080/other/path")).toBe(true);
  });

  it("allows a URL whose origin is in ALLOWED_PROXY_ORIGINS", async () => {
    process.env.ALLOWED_PROXY_ORIGINS =
      "http://192.168.1.100:4000,http://10.0.0.5:3000";
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("http://192.168.1.100:4000/commands")).toBe(true);
    expect(isAllowedProxyUrl("http://10.0.0.5:3000/remote")).toBe(true);
  });

  it("rejects a URL whose origin is not in any allowlist", async () => {
    process.env.COMPOSITE_VIDEO_PARSER_URL = "http://192.168.1.50:8080";
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("http://evil.com/steal")).toBe(false);
    expect(
      isAllowedProxyUrl("http://metadata.google.internal/computeMetadata/v1/"),
    ).toBe(false);
    expect(isAllowedProxyUrl("http://10.0.0.1:9090/internal")).toBe(false);
  });

  it("rejects non-http/https schemes", async () => {
    process.env.ALLOWED_PROXY_ORIGINS = "http://192.168.1.100:4000";
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedProxyUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedProxyUrl("data:text/html,<h1>hi</h1>")).toBe(false);
    expect(isAllowedProxyUrl("ftp://192.168.1.100:4000/file")).toBe(false);
  });

  it("rejects invalid URLs gracefully", async () => {
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("not-a-url")).toBe(false);
    expect(isAllowedProxyUrl("")).toBe(false);
  });

  it("rejects non-.local URLs when no allowlist is configured", async () => {
    delete process.env.COMPOSITE_VIDEO_PARSER_URL;
    delete process.env.ALLOWED_PROXY_ORIGINS;
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("http://192.168.1.100:4000/commands")).toBe(false);
  });

  it("allows .local mDNS URLs automatically", async () => {
    delete process.env.COMPOSITE_VIDEO_PARSER_URL;
    delete process.env.ALLOWED_PROXY_ORIGINS;
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("http://cd-player.local:4000/commands")).toBe(true);
    expect(isAllowedProxyUrl("http://my-device.local:8080/remote?device=Sony&command=5")).toBe(true);
    expect(isAllowedProxyUrl("http://raspberrypi.local/api")).toBe(true);
  });

  it("rejects .local URLs with non-http schemes", async () => {
    const { isAllowedProxyUrl } = await loadModule();

    expect(isAllowedProxyUrl("ftp://cd-player.local:4000/file")).toBe(false);
    expect(isAllowedProxyUrl("file://cd-player.local/etc/passwd")).toBe(false);
  });
});

describe("isAllowedImageUrl", () => {
  it("allows known CDN URLs", async () => {
    const { isAllowedImageUrl } = await loadModule();

    expect(isAllowedImageUrl("https://i.scdn.co/image/abc123")).toBe(true);
    expect(isAllowedImageUrl("https://i.discogs.com/some-image.jpg")).toBe(
      true,
    );
    expect(
      isAllowedImageUrl("https://lh3.googleusercontent.com/a/photo.jpg"),
    ).toBe(true);
  });

  it("allows URLs from ALLOWED_IMAGE_ORIGINS env var", async () => {
    process.env.ALLOWED_IMAGE_ORIGINS = "https://cdn.example.com";
    const { isAllowedImageUrl } = await loadModule();

    expect(isAllowedImageUrl("https://cdn.example.com/img/photo.png")).toBe(
      true,
    );
  });

  it("rejects URLs from unknown origins", async () => {
    const { isAllowedImageUrl } = await loadModule();

    expect(isAllowedImageUrl("https://evil.com/malware.exe")).toBe(false);
    expect(isAllowedImageUrl("http://192.168.1.1/internal.jpg")).toBe(false);
  });

  it("rejects non-https schemes", async () => {
    const { isAllowedImageUrl } = await loadModule();

    expect(isAllowedImageUrl("http://i.discogs.com/image.jpg")).toBe(false);
    expect(isAllowedImageUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects invalid URLs gracefully", async () => {
    const { isAllowedImageUrl } = await loadModule();

    expect(isAllowedImageUrl("not-a-url")).toBe(false);
    expect(isAllowedImageUrl("")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("returns a simple filename unchanged", async () => {
    const { sanitizeFilename } = await loadModule();

    expect(sanitizeFilename("image.jpg")).toBe("image.jpg");
    expect(sanitizeFilename("my-photo_2.png")).toBe("my-photo_2.png");
  });

  it("strips directory traversal sequences", async () => {
    const { sanitizeFilename } = await loadModule();

    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("../secret.txt")).toBe("secret.txt");
    expect(sanitizeFilename("foo/bar/baz.jpg")).toBe("baz.jpg");
  });

  it("replaces special characters", async () => {
    const { sanitizeFilename } = await loadModule();
    const result = sanitizeFilename("file<>name.jpg");

    // Should not contain < or >
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    // Should still end with .jpg
    expect(result).toMatch(/\.jpg$/);
  });

  it("handles empty string", async () => {
    const { sanitizeFilename } = await loadModule();
    const result = sanitizeFilename("");

    expect(typeof result).toBe("string");
  });
});

describe("isPathWithinDir", () => {
  it("returns true when path is within the directory", async () => {
    const { isPathWithinDir } = await loadModule();

    expect(isPathWithinDir("/app/data/images/photo.jpg", "/app/data/images")).toBe(true);
    expect(isPathWithinDir("/app/data/images/sub/photo.jpg", "/app/data/images")).toBe(true);
  });

  it("returns false when path escapes the directory", async () => {
    const { isPathWithinDir } = await loadModule();

    expect(isPathWithinDir("/app/data/images/../../etc/passwd", "/app/data/images")).toBe(false);
    expect(isPathWithinDir("/etc/passwd", "/app/data/images")).toBe(false);
  });

  it("handles relative paths by resolving them", async () => {
    const { isPathWithinDir } = await loadModule();
    const dir = path.resolve("test-dir");

    expect(isPathWithinDir(path.join(dir, "file.txt"), dir)).toBe(true);
    expect(isPathWithinDir(path.join(dir, "..", "file.txt"), dir)).toBe(false);
  });
});

