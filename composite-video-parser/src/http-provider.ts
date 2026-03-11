import sharp from "sharp";

import type { HttpProviderConfig } from "./config.js";
import {
  type FrameProvider,
  createFrameProviderBase,
} from "./frame-provider.js";

export const createHttpProvider = (
  config: HttpProviderConfig,
): FrameProvider => {
  const base = createFrameProviderBase();

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
      console.error(`[http-provider] fetch error: ${msg}`);
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
      restartInterval();
      // Fetch first frame immediately
      void fetchFrame();
    },
    stop: async () => {
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
    captureFrame: async () => {
      const frame = await fetchRawFrame();
      restartInterval();
      return frame;
    },
  };
};
