import { spawn, execFile, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";

import type { DeviceProviderConfig } from "./config.js";
import {
  type FrameProvider,
  createFrameProviderBase,
} from "./frame-provider.js";

const MAX_RESTART_ATTEMPTS = 10;

export const createDeviceProvider = (
  config: DeviceProviderConfig,
): FrameProvider => {
  const base = createFrameProviderBase();
  const frameSize = config.width * config.height * 3; // RGB24

  let process: ChildProcess | null = null;
  let buffer = Buffer.alloc(0);
  let stopping = false;
  let restartAttempts = 0;

  const resetDeviceControls = async (): Promise<void> => {
    const exec = promisify(execFile);
    try {
      const brightness = config.brightness ?? 0;
      const contrast = config.contrast ?? 128;
      await exec("v4l2-ctl", [
        "-d",
        config.device,
        "--set-ctrl",
        `brightness=${brightness},contrast=${contrast},saturation=128,hue=0,backlight_compensation=0`,
      ]);
      console.log(
        `[v4l2] set controls on ${config.device} (brightness=${brightness}, contrast=${contrast})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[v4l2] failed to reset controls: ${msg}`);
    }
  };

  const spawnFfmpeg = (): void => {
    const args = [
      "-loglevel",
      "error",
      "-f",
      "v4l2",
      "-i",
      config.device,
      "-s",
      `${config.width}x${config.height}`,
      "-r",
      String(config.fps),
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "pipe:1",
    ];

    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    process = proc;

    proc.stdout!.on("data", (chunk: Buffer) => {
      restartAttempts = 0;
      buffer = Buffer.concat([buffer, chunk]);

      // Extract complete frames, keep only the latest
      while (buffer.length >= frameSize) {
        const frame = buffer.subarray(0, frameSize);
        buffer = buffer.subarray(frameSize);
        // Only emit if this is the last complete frame in the buffer
        if (buffer.length < frameSize) {
          base.setFrame(Buffer.from(frame));
        }
      }
    });

    proc.stderr!.on("data", (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        console.error(`[ffmpeg] ${msg}`);
      }
    });

    proc.on("close", (code) => {
      if (!stopping) {
        restartAttempts++;
        if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
          console.error(
            `[ffmpeg] exited with code ${code}, giving up after ${MAX_RESTART_ATTEMPTS} failed attempts`,
          );
          stopping = true;
          return;
        }
        console.error(
          `[ffmpeg] exited with code ${code}, restarting in 2s... (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`,
        );
        setTimeout(() => {
          if (!stopping) {
            spawnFfmpeg();
          }
        }, 2000);
      }
    });

    proc.on("error", (err) => {
      console.error(`[ffmpeg] spawn error: ${err.message}`);
    });
  };

  return {
    start: async () => {
      stopping = false;
      restartAttempts = 0;
      buffer = Buffer.alloc(0);
      await resetDeviceControls();
      spawnFfmpeg();
    },
    stop: async () => {
      stopping = true;
      if (process) {
        process.kill("SIGTERM");
        process = null;
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
