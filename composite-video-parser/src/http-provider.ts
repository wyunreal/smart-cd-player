import sharp from 'sharp';

import type { HttpProviderConfig } from './config.js';
import { BaseFrameProvider } from './frame-provider.js';

export class HttpFrameProvider extends BaseFrameProvider {
  private timer: ReturnType<typeof setInterval> | null = null;
  private fetching = false;

  constructor(private readonly config: HttpProviderConfig) {
    super();
  }

  async start(): Promise<void> {
    const intervalMs = Math.round(1000 / this.config.fps);
    this.timer = setInterval(() => {
      void this.fetchFrame();
    }, intervalMs);
    // Fetch first frame immediately
    void this.fetchFrame();
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async fetchFrame(): Promise<void> {
    if (this.fetching) return;
    this.fetching = true;

    try {
      const response = await fetch(this.config.url);
      if (!response.ok) {
        console.error(`[http-provider] HTTP ${response.status} from ${this.config.url}`);
        return;
      }

      const pngBuffer = Buffer.from(await response.arrayBuffer());

      // Convert PNG to raw RGB to match the same interface as device provider
      const { data } = await sharp(pngBuffer)
        .resize(this.config.width, this.config.height, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      this.setFrame(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[http-provider] fetch error: ${msg}`);
    } finally {
      this.fetching = false;
    }
  }
}
