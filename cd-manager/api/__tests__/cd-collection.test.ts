/**
 * @jest-environment node
 */

import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import type { Art, Cd } from "../types";
import {
  processedFileName,
  processedThumbFileName,
} from "../image-processing/naming";

let testDir: string;
let dataDir: string;
let imagesDir: string;
let fixturePath: string;

const collectionPath = () => path.join(dataDir, "cd-collection.json");

const makeArt = (fileName: string): Art => ({
  uri: `/api/images/${fileName}`,
  uri150: `/api/images/${fileName.replace(/(\.[^.]+)$/, "-150$1")}`,
  width: 600,
  height: 600,
  type: "primary",
});

const makeCd = (id: number): Cd => ({
  id,
  title: `Album ${id}`,
  artist: "Artist",
  genre: "Rock",
  tracks: [],
  art: {
    album: makeArt(`${id}-album.jpg`),
    artist: makeArt(`${id}-artist.jpg`),
    cd: makeArt(`${id}-cd.jpg`),
  },
});

const makeNewCd = (): Cd => ({
  id: 0,
  title: "New",
  artist: "New Artist",
  genre: "Pop",
  tracks: [],
  art: {
    album: makeArt("new-album.jpg"),
    artist: makeArt("new-artist.jpg"),
    cd: makeArt("new-cd.jpg"),
  },
});

const writeCollection = (cds: Cd[]): void => {
  fs.writeFileSync(collectionPath(), JSON.stringify(cds));
};

const readRawCollection = (): Cd[] =>
  JSON.parse(fs.readFileSync(collectionPath(), "utf8")) as Cd[];

const createProcessedVariants = (fileName: string): void => {
  fs.writeFileSync(path.join(imagesDir, processedFileName(fileName)), "large");
  fs.writeFileSync(
    path.join(imagesDir, processedThumbFileName(fileName)),
    "thumb",
  );
};

const loadCollectionModule = () => import("../cd-collection");

const mockDownloadTo = async (kind: "image" | "invalid") => {
  const fileStorage = await import("../file-storage");

  return jest
    .spyOn(fileStorage, "downloadImage")
    .mockImplementation(async (_url: string, fileName: string) => {
      const target = path.join(imagesDir, fileName);

      if (kind === "image") {
        fs.copyFileSync(fixturePath, target);
      } else {
        fs.writeFileSync(target, "not an image");
      }

      return target;
    });
};

beforeAll(async () => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "cd-collection-test-"));
  dataDir = path.join(testDir, "db");
  imagesDir = path.join(testDir, "images");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  fixturePath = path.join(testDir, "fixture.jpg");
  await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 3,
      background: "#336699",
    },
  })
    .jpeg()
    .toFile(fixturePath);

  process.env.DATA_DIR = dataDir;
  process.env.IMAGES_DIR = imagesDir;
});

afterAll(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
  delete process.env.DATA_DIR;
  delete process.env.IMAGES_DIR;
});

beforeEach(() => {
  jest.resetModules();
  delete process.env.USE_PROCESSED_IMAGES;
  fs.rmSync(collectionPath(), { force: true });
  fs.rmSync(path.join(dataDir, "db-metadata.json"), { force: true });
  fs.rmSync(imagesDir, { recursive: true, force: true });
  fs.mkdirSync(imagesDir, { recursive: true });
});

describe("cd collection artwork resolution", () => {
  it("serves the processed artwork when it exists, without touching the JSON", async () => {
    writeCollection([makeCd(1)]);
    createProcessedVariants("1-album.jpg");
    createProcessedVariants("1-artist.jpg");
    createProcessedVariants("1-cd.jpg");

    const { getCdCollection } = await loadCollectionModule();
    const [cd] = await getCdCollection();

    expect(cd.art?.album?.uri).toBe(
      `/api/images/${processedFileName("1-album.jpg")}`,
    );
    expect(cd.art?.artist?.uri150).toBe(
      `/api/images/${processedThumbFileName("1-artist.jpg")}`,
    );
    expect(cd.art?.cd?.uri).toBe(
      `/api/images/${processedFileName("1-cd.jpg")}`,
    );

    // The database must keep pointing at the raw originals.
    const persisted = readRawCollection();
    expect(persisted[0].art?.album?.uri).toBe("/api/images/1-album.jpg");
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/1-cd.jpg");
  });

  it("falls back to the raw artwork when processed files are absent", async () => {
    writeCollection([makeCd(2)]);

    const { getCdCollection } = await loadCollectionModule();
    const [cd] = await getCdCollection();

    expect(cd.art?.cd?.uri).toBe("/api/images/2-cd.jpg");
  });

  it("can be disabled with USE_PROCESSED_IMAGES=false", async () => {
    writeCollection([makeCd(3)]);
    createProcessedVariants("3-cd.jpg");

    const { getCdCollection } = await loadCollectionModule();
    process.env.USE_PROCESSED_IMAGES = "false";

    const [cd] = await getCdCollection();
    expect(cd.art?.cd?.uri).toBe("/api/images/3-cd.jpg");
  });

  it("keeps raw URIs when editing a CD", async () => {
    writeCollection([makeCd(4)]);
    createProcessedVariants("4-cd.jpg");

    const { editCd } = await loadCollectionModule();
    await editCd({ album: "Edited", artist: "Artist", genre: "Metal" }, 4);

    const persisted = readRawCollection();
    expect(persisted[0].title).toBe("Edited");
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/4-cd.jpg");
    expect(persisted[0].art?.cd?.uri150).toBe("/api/images/4-cd-150.jpg");
  });

  it("keeps raw URIs when adding a CD", async () => {
    writeCollection([makeCd(5)]);
    createProcessedVariants("5-cd.jpg");

    const { addCd } = await loadCollectionModule();
    const ids = await addCd([
      { id: 0, title: "New", artist: "New Artist", genre: "Pop", tracks: [] },
    ]);

    expect(ids).toEqual([6]);
    const persisted = readRawCollection();
    expect(persisted).toHaveLength(2);
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/5-cd.jpg");
  });

  it("keeps raw URIs when deleting another CD", async () => {
    writeCollection([makeCd(6), makeCd(7)]);
    createProcessedVariants("6-cd.jpg");

    const { deleteCd } = await loadCollectionModule();
    await deleteCd(7);

    const persisted = readRawCollection();
    expect(persisted).toHaveLength(1);
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/6-cd.jpg");
  });

  it("generates processed artwork when adding a CD", async () => {
    writeCollection([]);
    await mockDownloadTo("image");

    const { addCd } = await loadCollectionModule();
    const ids = await addCd([makeNewCd()]);

    expect(ids).toEqual([1]);

    for (const fileName of ["1-album.jpg", "1-artist.jpg", "1-cd.jpg"]) {
      expect(fs.existsSync(path.join(imagesDir, fileName))).toBe(true);
      expect(
        fs.existsSync(path.join(imagesDir, processedFileName(fileName))),
      ).toBe(true);
      expect(
        fs.existsSync(path.join(imagesDir, processedThumbFileName(fileName))),
      ).toBe(true);
    }

    const persisted = readRawCollection();
    expect(persisted[0].art?.album?.uri).toBe("/api/images/1-album.jpg");
    expect(persisted[0].art?.artist?.uri).toBe("/api/images/1-artist.jpg");
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/1-cd.jpg");
  });

  it("still adds the CD with raw files if processing fails", async () => {
    writeCollection([]);
    await mockDownloadTo("invalid");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { addCd } = await loadCollectionModule();
    const ids = await addCd([makeNewCd()]);
    warn.mockRestore();

    expect(ids).toEqual([1]);
    expect(fs.existsSync(path.join(imagesDir, "1-cd.jpg"))).toBe(true);
    expect(
      fs.existsSync(path.join(imagesDir, processedFileName("1-cd.jpg"))),
    ).toBe(false);

    const persisted = readRawCollection();
    expect(persisted[0].art?.cd?.uri).toBe("/api/images/1-cd.jpg");
  });
});
