/**
 * Processes the images referenced by the CD collection.
 *
 * Safety rules:
 *  - Raw images are never modified, renamed or deleted.
 *  - Only files matching `processed-v<version>-*.webp` are written.
 *  - The collection JSON is never written.
 *  - Dry-run is the default; pass `--write` to materialise the changes.
 *
 * Usage:
 *   yarn images:process [--write] [--only=cd,album,artist] [--limit=N]
 *                       [--force] [--concurrency=N] [--report=PATH]
 *   yarn images:process --revert [--version=N] [--write]
 *   yarn images:process --prune-old-versions [--write]
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { Cd } from "../api/types";
import {
  DISC_MIN_CONFIDENCE,
  PROCESSING_VERSION,
  isArtKind,
  isProcessedFileName,
  normalizeArt,
  processedFileName,
  processedThumbFileName,
  processedVersionFromFileName,
  rawFileNameFromUri,
  type ArtKind,
  type DiscCropInfo,
} from "../api/image-processing";

sharp.cache(false);

type CliOptions = {
  write: boolean;
  revert: boolean;
  pruneOldVersions: boolean;
  only: Set<ArtKind>;
  limit: number | null;
  force: boolean;
  concurrency: number;
  version: number | null;
  reportPath: string | null;
  help: boolean;
};

type Status =
  | "processed"
  | "would-process"
  | "skipped"
  | "missing"
  | "external"
  | "invalid"
  | "duplicate"
  | "failed";

type ResultEntry = {
  cdId: number;
  artist: string;
  album: string;
  kind: ArtKind | "unknown";
  uri?: string;
  rawFileName?: string;
  status: Status;
  largeFile?: string;
  thumbFile?: string;
  sourceBytes?: number;
  largeBytes?: number;
  thumbBytes?: number;
  outputWidth?: number;
  outputHeight?: number;
  disc?: DiscCropInfo;
  needsReview?: boolean;
  error?: string;
};

type Config = {
  dataDir: string;
  imagesDir: string;
  dataFile: string;
};

type Report = {
  generatedAt: string;
  mode: "dry-run" | "apply";
  operation: "process" | "revert" | "prune";
  processingVersion: number;
  imagesDir: string;
  dataFile?: string;
  summary: Record<string, number>;
  results: Array<Record<string, unknown>>;
};

const ART_KINDS: readonly ArtKind[] = ["album", "artist", "cd"];

const HELP = `Procesa y normaliza las imágenes del catálogo de CDs.

Las imágenes raw nunca se modifican. Las procesadas se escriben con el
prefijo "processed-v${PROCESSING_VERSION}-" y quedan listas para que la app
las use. Sin --write no se escribe nada (dry-run).

Uso:
  yarn images:process [opciones]

Opciones:
  --write                  Aplica los cambios (por defecto solo simula)
  --only=cd,album,artist   Limita a esos tipos de imagen
  --limit=N                Procesa como máximo N imágenes
  --force                  Regenera imágenes ya procesadas
  --concurrency=N          Imágenes en paralelo (por defecto 4)
  --report=PATH            Escribe el informe JSON en PATH

Reversión:
  --revert                 Borra las imágenes processed-v* (con --write)
  --version=N              Con --revert, limita a esa versión
  --prune-old-versions     Borra versiones antiguas (con --write)

Ejemplos:
  yarn images:process --only=cd --limit=20
  yarn images:process --write
  yarn images:process --revert --write
`;

const timestampForFileName = (): string =>
  new Date().toISOString().replace(/[:.]/g, "-");

const parseInteger = (value: string, flag: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} expects a positive integer`);
  }
  return parsed;
};

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    write: false,
    revert: false,
    pruneOldVersions: false,
    only: new Set(),
    limit: null,
    force: false,
    concurrency: 4,
    version: null,
    reportPath: null,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--write") {
      options.write = true;
    } else if (arg === "--revert") {
      options.revert = true;
    } else if (arg === "--prune-old-versions") {
      options.pruneOldVersions = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("--only=")) {
      const values = arg
        .slice("--only=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      for (const value of values) {
        if (!isArtKind(value)) {
          throw new Error(`Unknown art kind in --only: ${value}`);
        }
        options.only.add(value);
      }
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInteger(arg.slice("--limit=".length), "--limit");
    } else if (arg.startsWith("--concurrency=")) {
      options.concurrency = parseInteger(
        arg.slice("--concurrency=".length),
        "--concurrency",
      );
    } else if (arg.startsWith("--version=")) {
      options.version = parseInteger(arg.slice("--version=".length), "--version");
    } else if (arg.startsWith("--report=")) {
      options.reportPath = arg.slice("--report=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.revert && options.pruneOldVersions) {
    throw new Error("Use --revert or --prune-old-versions, not both");
  }

  return options;
};

const resolveConfig = (): Config => {
  const dataDir = path.resolve(
    process.env.DATA_DIR ?? path.join(process.cwd(), "..", "data", "db"),
  );
  const imagesDir = path.resolve(
    process.env.IMAGES_DIR ?? path.join(process.cwd(), "..", "data", "images"),
  );

  return {
    dataDir,
    imagesDir,
    dataFile: path.join(dataDir, "cd-collection.json"),
  };
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const stats = await fs.promises.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
};

let temporaryFileCounter = 0;

const writeFileAtomic = async (target: string, data: Buffer): Promise<void> => {
  const temporary = `${target}.tmp-${process.pid}-${temporaryFileCounter++}`;
  await fs.promises.writeFile(temporary, data);

  try {
    await fs.promises.rename(temporary, target);
  } catch (error) {
    await fs.promises.rm(temporary, { force: true });
    throw error;
  }
};

/**
 * Last line of defence: the CLI must never write over a raw file or create a
 * file outside the images directory.
 */
const assertProcessedTarget = (target: string, imagesDir: string): void => {
  const resolvedDir = path.resolve(imagesDir);
  const resolvedTarget = path.resolve(target);

  if (
    path.dirname(resolvedTarget) !== resolvedDir ||
    !isProcessedFileName(path.basename(resolvedTarget))
  ) {
    throw new Error(`Refusing to write non-processed file: ${resolvedTarget}`);
  }
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> => {
  let nextIndex = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        await worker(items[index]);
      }
    },
  );

  await Promise.all(runners);
};

type WorkItem = {
  entry: ResultEntry;
  rawPath: string;
};

const buildWorkItems = (
  cds: Cd[],
  imagesDir: string,
  options: CliOptions,
  results: ResultEntry[],
): WorkItem[] => {
  const items: WorkItem[] = [];
  const claimedTargets = new Set<string>();

  for (const cd of cds) {
    for (const kind of ART_KINDS) {
      if (options.only.size > 0 && !options.only.has(kind)) continue;

      const art = cd.art?.[kind];
      if (!art?.uri) continue;

      const base = {
        cdId: cd.id,
        artist: cd.artist,
        album: cd.title,
        kind,
        uri: art.uri,
      };

      const rawFileName = rawFileNameFromUri(art.uri);
      if (!rawFileName) {
        results.push({
          ...base,
          status: art.uri.startsWith("http") ? "external" : "invalid",
        });
        continue;
      }

      if (isProcessedFileName(rawFileName)) {
        results.push({ ...base, rawFileName, status: "skipped" });
        continue;
      }

      const largeFile = processedFileName(rawFileName);
      if (claimedTargets.has(largeFile)) {
        results.push({ ...base, rawFileName, status: "duplicate" });
        continue;
      }
      claimedTargets.add(largeFile);

      const entry: ResultEntry = {
        ...base,
        rawFileName,
        status: "skipped",
        largeFile,
        thumbFile: processedThumbFileName(rawFileName),
      };

      items.push({
        entry,
        rawPath: path.join(imagesDir, rawFileName),
      });
    }
  }

  return options.limit == null ? items : items.slice(0, options.limit);
};

const processItem = async (
  item: WorkItem,
  options: CliOptions,
  imagesDir: string,
): Promise<ResultEntry> => {
  const { entry } = item;

  try {
    const stats = await fs.promises.stat(item.rawPath).catch(() => null);
    if (!stats?.isFile()) {
      return { ...entry, status: "missing" };
    }

    const largePath = path.join(imagesDir, entry.largeFile as string);
    const thumbPath = path.join(imagesDir, entry.thumbFile as string);
    const [hasLarge, hasThumb] = await Promise.all([
      fileExists(largePath),
      fileExists(thumbPath),
    ]);

    if (!options.force && hasLarge && hasThumb) {
      return {
        ...entry,
        status: "skipped",
        sourceBytes: stats.size,
      };
    }

    const input = await fs.promises.readFile(item.rawPath);
    const processed = await normalizeArt(input, entry.kind as ArtKind);

    const result: ResultEntry = {
      ...entry,
      sourceBytes: stats.size,
      largeBytes: processed.large.buffer.length,
      thumbBytes: processed.thumb.buffer.length,
      outputWidth: processed.large.width,
      outputHeight: processed.large.height,
      disc: processed.disc,
      needsReview:
        entry.kind === "cd" &&
        (!processed.disc?.detected ||
          processed.disc.confidence < DISC_MIN_CONFIDENCE),
    };

    if (!options.write) {
      return { ...result, status: "would-process" };
    }

    assertProcessedTarget(largePath, imagesDir);
    assertProcessedTarget(thumbPath, imagesDir);

    await writeFileAtomic(largePath, processed.large.buffer);
    await writeFileAtomic(thumbPath, processed.thumb.buffer);

    return { ...result, status: "processed" };
  } catch (error) {
    return {
      ...entry,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const runProcessing = async (
  options: CliOptions,
  config: Config,
): Promise<Report> => {
  const rawCollection = await fs.promises.readFile(config.dataFile, "utf8");
  const parsed: unknown = JSON.parse(rawCollection);

  if (!Array.isArray(parsed)) {
    throw new Error(`${config.dataFile} does not contain a CD array`);
  }

  const results: ResultEntry[] = [];
  const items = buildWorkItems(parsed as Cd[], config.imagesDir, options, results);

  const total = items.length;
  let completed = 0;

  await runWithConcurrency(items, options.concurrency, async (item) => {
    const result = await processItem(item, options, config.imagesDir);
    results.push(result);
    completed++;

    if (options.write && (completed % 25 === 0 || completed === total)) {
      console.log(`  ${completed}/${total} images processed`);
    }
  });

  results.sort((a, b) => a.cdId - b.cdId || String(a.kind).localeCompare(String(b.kind)));

  const summary: Record<string, number> = {
    total: results.length,
    processed: 0,
    wouldProcess: 0,
    skipped: 0,
    missing: 0,
    external: 0,
    invalid: 0,
    duplicate: 0,
    failed: 0,
    needsReview: 0,
  };

  for (const result of results) {
    if (result.status === "processed") summary.processed++;
    if (result.status === "would-process") summary.wouldProcess++;
    if (result.status === "skipped") summary.skipped++;
    if (result.status === "missing") summary.missing++;
    if (result.status === "external") summary.external++;
    if (result.status === "invalid") summary.invalid++;
    if (result.status === "duplicate") summary.duplicate++;
    if (result.status === "failed") summary.failed++;
    if (result.needsReview) summary.needsReview++;
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: options.write ? "apply" : "dry-run",
    operation: "process",
    processingVersion: PROCESSING_VERSION,
    imagesDir: config.imagesDir,
    dataFile: config.dataFile,
    summary,
    results: results as unknown as Array<Record<string, unknown>>,
  };
};

const runRevert = async (
  options: CliOptions,
  config: Config,
): Promise<Report> => {
  const entries = await fs.promises.readdir(config.imagesDir, {
    withFileTypes: true,
  });

  const targets = entries
    .filter((entry) => entry.isFile() && isProcessedFileName(entry.name))
    .map((entry) => entry.name)
    .filter(
      (fileName) =>
        options.version == null ||
        processedVersionFromFileName(fileName) === options.version,
    )
    .sort();

  const results: Array<Record<string, unknown>> = [];

  for (const fileName of targets) {
    if (options.write) {
      await fs.promises.unlink(path.join(config.imagesDir, fileName));
    }

    results.push({
      file: fileName,
      status: options.write ? "deleted" : "would-delete",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: options.write ? "apply" : "dry-run",
    operation: "revert",
    processingVersion: PROCESSING_VERSION,
    imagesDir: config.imagesDir,
    summary: {
      total: targets.length,
      deleted: options.write ? targets.length : 0,
      wouldDelete: options.write ? 0 : targets.length,
    },
    results,
  };
};

const runPruneOldVersions = async (
  options: CliOptions,
  config: Config,
): Promise<Report> => {
  const entries = await fs.promises.readdir(config.imagesDir, {
    withFileTypes: true,
  });

  const targets = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => {
      const version = processedVersionFromFileName(fileName);
      return version != null && version !== PROCESSING_VERSION;
    })
    .sort();

  const results: Array<Record<string, unknown>> = [];

  for (const fileName of targets) {
    const version = processedVersionFromFileName(fileName);

    if (options.write) {
      await fs.promises.unlink(path.join(config.imagesDir, fileName));
    }

    results.push({
      file: fileName,
      version,
      status: options.write ? "deleted" : "would-delete",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: options.write ? "apply" : "dry-run",
    operation: "prune",
    processingVersion: PROCESSING_VERSION,
    imagesDir: config.imagesDir,
    summary: {
      total: targets.length,
      deleted: options.write ? targets.length : 0,
      wouldDelete: options.write ? 0 : targets.length,
    },
    results,
  };
};

const writeReport = async (
  report: Report,
  options: CliOptions,
  config: Config,
): Promise<string | null> => {
  const reportPath = options.reportPath
    ? path.resolve(options.reportPath)
    : options.write
      ? path.join(
          config.dataDir,
          "reports",
          `processed-images-${timestampForFileName()}.json`,
        )
      : null;

  if (!reportPath) return null;

  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(
    reportPath,
    JSON.stringify(report, null, 2),
    "utf8",
  );

  return reportPath;
};

const printSummary = (
  report: Report,
  options: CliOptions,
  reportPath: string | null,
): void => {
  const mode = options.write ? "apply" : "dry-run (use --write to apply)";

  console.log(`Image processing — ${report.operation} — ${mode}`);
  console.log(`  version: v${report.processingVersion}`);
  console.log(`  images:  ${report.imagesDir}`);

  if (report.operation === "process") {
    const summary = report.summary;
    console.log(
      `  result:  ${summary.processed + summary.wouldProcess} ready, ` +
        `${summary.skipped} skipped, ${summary.failed} failed, ` +
        `${summary.missing + summary.external + summary.invalid} unavailable`,
    );

    const review = report.results.filter(
      (result) => result.needsReview === true,
    );

    if (review.length > 0) {
      console.log(`  review:  ${review.length} disc(s) need manual review`);
      for (const item of review.slice(0, 20)) {
        const confidence = (item.disc as DiscCropInfo | undefined)?.confidence;
        console.log(
          `    - ${item.rawFileName} (${item.kind}, confidence ${confidence?.toFixed(2) ?? "n/a"})`,
        );
      }
      if (review.length > 20) {
        console.log("    ... see the JSON report for the full list");
      }
    }

    if (summary.failed > 0) {
      const failures = report.results.filter(
        (result) => result.status === "failed",
      );
      for (const item of failures.slice(0, 10)) {
        console.log(`    ! ${item.rawFileName}: ${item.error}`);
      }
    }
  } else {
    const summary = report.summary;
    console.log(
      `  result:  ${summary.deleted} deleted, ${summary.wouldDelete} would be deleted`,
    );
  }

  if (reportPath) console.log(`  report:  ${reportPath}`);
};

const main = async (): Promise<void> => {
  let options: CliOptions;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      error instanceof Error ? `Error: ${error.message}` : `Error: ${error}`,
    );
    console.error("Run with --help for usage.");
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    console.log(HELP);
    return;
  }

  const config = resolveConfig();

  if (!fs.existsSync(config.imagesDir)) {
    console.error(`Images directory not found: ${config.imagesDir}`);
    process.exitCode = 2;
    return;
  }

  try {
    let report: Report;

    if (options.revert) {
      report = await runRevert(options, config);
    } else if (options.pruneOldVersions) {
      report = await runPruneOldVersions(options, config);
    } else {
      if (!fs.existsSync(config.dataFile)) {
        console.error(`Collection not found: ${config.dataFile}`);
        process.exitCode = 2;
        return;
      }
      report = await runProcessing(options, config);
    }

    const reportPath = await writeReport(report, options, config);
    printSummary(report, options, reportPath);

    if ((report.summary.failed ?? 0) > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(
      error instanceof Error ? `Error: ${error.message}` : `Error: ${error}`,
    );
    process.exitCode = 2;
  }
};

void main();
