/**
 * @jest-environment node
 */

import {
  imageUriForFileName,
  isProcessedFileName,
  processedFileName,
  processedThumbFileName,
  processedVersionFromFileName,
  rawFileNameFromUri,
} from "../naming";

describe("processed naming", () => {
  it("builds the processed filename from the raw one", () => {
    expect(processedFileName("12-cd.jpg")).toBe(
      "processed-v1-12-cd.jpg.webp",
    );
    expect(processedThumbFileName("12-cd.png")).toBe(
      "processed-v1-12-cd.png-150.webp",
    );
  });

  it("supports explicit versions", () => {
    expect(processedFileName("7-album.webp", 3)).toBe(
      "processed-v3-7-album.webp.webp",
    );
  });

  it("recognises and parses processed filenames", () => {
    expect(isProcessedFileName("processed-v1-12-cd.jpg.webp")).toBe(true);
    expect(isProcessedFileName("processed-v12-1-cd.jpg-150.webp")).toBe(true);
    expect(isProcessedFileName("12-cd.jpg")).toBe(false);
    expect(isProcessedFileName("processed-12-cd.jpg.webp")).toBe(false);

    expect(processedVersionFromFileName("processed-v12-1-cd.jpg.webp")).toBe(
      12,
    );
    expect(processedVersionFromFileName("12-cd.jpg")).toBeNull();
  });

  it("extracts local filenames from the image route", () => {
    expect(rawFileNameFromUri("/api/images/12-cd.jpg")).toBe("12-cd.jpg");
    expect(rawFileNameFromUri("/api/images/12-cd.jpg?x=1")).toBe("12-cd.jpg");
    expect(rawFileNameFromUri("/api/images/with%20space.jpg")).toBe(
      "with space.jpg",
    );
  });

  it("rejects external, empty and unsafe URIs", () => {
    expect(rawFileNameFromUri("https://i.discogs.com/a.jpg")).toBeNull();
    expect(rawFileNameFromUri("")).toBeNull();
    expect(rawFileNameFromUri("/api/images/../secret.jpg")).toBeNull();
    expect(rawFileNameFromUri("/api/images/a/b.jpg")).toBeNull();
  });

  it("round-trips the image URI", () => {
    expect(imageUriForFileName("12-cd.jpg")).toBe("/api/images/12-cd.jpg");
  });
});
