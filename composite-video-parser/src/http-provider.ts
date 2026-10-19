import sharp from "sharp";

import type { HttpProviderConfig } from "./config.js";
import {
  type FrameProvider,
  createFrameProviderBase,
} from "./frame-provider.js";
import type { ProviderOptions } from "./device-provider.js";

export const createHttpProvider = (
  config: HttpProviderConfig,
  options: ProviderOptions = {},
): FrameProvider => {
  const base = createFrameProviderBase();
  const logPrefix = options.name ? `[${options.name}] ` : "";

  let timer: ReturnType<typeof setInterval> | null = null;
  let fetching = false;

  const fetchRawFrame = async (): Promise<Buffer> => {
    const response = await fetch(config.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${config.url}`);
    }
    const pngBuffer = Buffer.from(await response.arrayBuffer());
    // Convert PNG to raw RGB to match the same interface as device provider
    const { data } = await sharp(pngBuffer)
      .resize(config.width, config.height, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return data;
  };

  const fetchFrame = async (): Promise<void> => {
    if (fetching) return;
    fetching = true;
    try {
      base.setFrame(await fetchRawFrame());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      base.setError(msg);
      console.error(`${logPrefix}[http-provider] fetch error: ${msg}`);
    } finally {
      fetching = false;
    }
  };

  const intervalMs = Math.round(1000 / config.fps);

  const restartInterval = (): void => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      void fetchFrame();
    }, intervalMs);
  };

  return {
    start: async () => {
      base.clearError();
      restartInterval();
      // Fetch first frame immediately
      void fetchFrame();
    },
    stop: async () => {
      base.clearError();
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    on: (event, listener) => {
      base.emitter.on(event, listener);
    },
    off: (event, listener) => {
      base.emitter.off(event, listener);
    },
    getLatestFrame: base.getLatestFrame,
    getLastError: base.getLastError,
    captureFrame: async () => {
      try {
        const frame = await fetchRawFrame();
        base.clearError();
        restartInterval();
        return frame;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        base.setError(msg);
        throw err;
      }
    },
  };
};
