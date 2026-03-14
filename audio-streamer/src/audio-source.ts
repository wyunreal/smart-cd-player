import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface AudioSourceConfig {
  device: string;   // ALSA device, e.g. "hw:1,0"
  sampleRate?: number;
  channels?: number;
}

export class AudioSource extends EventEmitter {
  private process: ChildProcess | null = null;
  private readonly config: Required<AudioSourceConfig>;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(config: AudioSourceConfig) {
    super();
    this.config = {
      sampleRate: 48000,
      channels: 2,
      ...config,
    };
  }

  get sampleRate(): number { return this.config.sampleRate; }
  get channels(): number { return this.config.channels; }

  start(): void {
    this.stopped = false;
    this.spawn();
  }

  stop(): void {
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private spawn(): void {
    const { device, sampleRate, channels } = this.config;

    const args = [
      '-thread_queue_size', '4096',
      '-f', 'alsa',
      '-channels', String(channels),
      '-sample_rate', String(sampleRate),
      '-i', device,

      // Output FLAC (lossless, level 5, 4096-sample frames) to stdout
      '-f', 'flac',
      '-compression_level', '5',
      '-frame_size', '4096',
      '-ar', String(sampleRate),
      '-ac', String(channels),
      'pipe:1',
    ];

    console.log(`[ffmpeg] Capturing ${device} → FLAC level 5 ${sampleRate}Hz ${channels}ch`);

    this.process = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.emit('data', chunk);
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      const line = data.toString().trim();
      if (line.includes('Error') || line.includes('error')) {
        console.warn(`[ffmpeg] ${line}`);
      }
    });

    this.process.on('exit', (code, signal) => {
      console.warn(`[ffmpeg] Process exited (code=${code}, signal=${signal})`);
      this.process = null;
      if (!this.stopped) {
        console.log('[ffmpeg] Restarting in 3s...');
        this.restartTimer = setTimeout(() => this.spawn(), 3000);
      }
    });
  }
}
