import { spawn, execFile, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';

import type { DeviceProviderConfig } from './config.js';
import { BaseFrameProvider } from './frame-provider.js';

export class DeviceFrameProvider extends BaseFrameProvider {
  private process: ChildProcess | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private readonly frameSize: number;
  private stopping = false;

  constructor(private readonly config: DeviceProviderConfig) {
    super();
    this.frameSize = config.width * config.height * 3; // RGB24
  }

  async start(): Promise<void> {
    this.stopping = false;
    await this.resetDeviceControls();
    this.spawnFfmpeg();
  }

  private async resetDeviceControls(): Promise<void> {
    const exec = promisify(execFile);
    try {
      const brightness = this.config.brightness ?? 0;
      const contrast = this.config.contrast ?? 128;
      await exec('v4l2-ctl', [
        '-d', this.config.device,
        '--set-ctrl', `brightness=${brightness},contrast=${contrast},saturation=128,hue=0,backlight_compensation=0`,
      ]);
      console.log(`[v4l2] set controls on ${this.config.device} (brightness=${brightness}, contrast=${contrast})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[v4l2] failed to reset controls: ${msg}`);
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private spawnFfmpeg(): void {
    const args = [
      '-f', 'v4l2',
      '-i', this.config.device,
      '-s', `${this.config.width}x${this.config.height}`,
      '-r', String(this.config.fps),
      '-f', 'rawvideo',
      '-pix_fmt', 'rgb24',
      'pipe:1',
    ];

    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    this.process = proc;

    proc.stdout!.on('data', (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);

      // Extract complete frames, keep only the latest
      while (this.buffer.length >= this.frameSize) {
        const frame = this.buffer.subarray(0, this.frameSize);
        this.buffer = this.buffer.subarray(this.frameSize);
        // Only emit if this is the last complete frame in the buffer
        if (this.buffer.length < this.frameSize) {
          this.setFrame(Buffer.from(frame));
        }
      }
    });

    proc.stderr!.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        console.error(`[ffmpeg] ${msg}`);
      }
    });

    proc.on('close', (code) => {
      if (!this.stopping) {
        console.error(`[ffmpeg] exited with code ${code}, restarting in 2s...`);
        setTimeout(() => {
          if (!this.stopping) {
            this.spawnFfmpeg();
          }
        }, 2000);
      }
    });

    proc.on('error', (err) => {
      console.error(`[ffmpeg] spawn error: ${err.message}`);
    });
  }
}
