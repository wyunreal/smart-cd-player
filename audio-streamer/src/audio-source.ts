import { spawn, type ChildProcess } from 'child_process';
import { OPUS_PAYLOAD_TYPE, OPUS_SSRC } from './mediasoup-mgr.js';

export interface AudioSourceConfig {
  device: string;   // ALSA device, e.g. "hw:0,0"
  rtpPort: number;  // mediasoup PlainTransport port
  sampleRate?: number;
  channels?: number;
  bitrate?: string;
}

export class AudioSource {
  private process: ChildProcess | null = null;
  private readonly config: Required<AudioSourceConfig>;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(config: AudioSourceConfig) {
    this.config = {
      sampleRate: 48000,
      channels: 2,
      bitrate: '510k',
      ...config,
    };
  }

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
    const { device, rtpPort, sampleRate, channels, bitrate } = this.config;

    const args = [
      // Input: ALSA capture device
      '-f', 'alsa',
      '-channels', String(channels),
      '-sample_rate', String(sampleRate),
      '-i', device,

      // Encode to Opus (HiFi settings)
      '-c:a', 'libopus',
      '-b:a', bitrate,
      '-ar', String(sampleRate),
      '-ac', String(channels),
      '-application', 'audio',      // Optimised for music / HiFi
      '-frame_duration', '20',      // 20ms frames — good quality/latency balance
      '-vbr', 'off',                // CBR for consistent quality
      '-compression_level', '10',   // Max encoding quality

      // RTP output
      '-ssrc', String(OPUS_SSRC),
      '-payload_type', String(OPUS_PAYLOAD_TYPE),
      '-f', 'rtp',
      `rtp://127.0.0.1:${rtpPort}`,
    ];

    console.log(`[ffmpeg] Capturing ${device} → rtp://127.0.0.1:${rtpPort}`);

    this.process = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    this.process.stderr?.on('data', (data: Buffer) => {
      // Log only first few lines (FFmpeg is verbose at startup)
      const line = data.toString().trim();
      if (line.includes('Error') || line.includes('error') || line.includes('Warning')) {
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
