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

  const fetchFrame = async (): Promise<void> => {
    if (fetching) return;
    fetching = true;

    try {
      const response = await fetch(config.url);
      if (!response.ok) {
        console.error(
          `[http-provider] HTTP ${response.status} from ${config.url}`,
        );
        return;
      }

      const pngBuffer = Buffer.from(await response.arrayBuffer());

      // Convert PNG to raw RGB to match the same interface as device provider
      const { data } = await sharp(pngBuffer)
        .resize(config.width, config.height, { fit: "fill" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      base.setFrame(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[http-provider] fetch error: ${msg}`);
    } finally {
      fetching = false;
    }
  };

  return {
    start: async () => {
      const intervalMs = Math.round(1000 / config.fps);
      timer = setInterval(() => {
        void fetchFrame();
      }, intervalMs);
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
  };
};
