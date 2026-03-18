import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AudioSource, type AudioSourceConfig } from './audio-source.js';
import { createServer } from './server.js';

interface AudioProfile {
  device: string;
  sampleRate?: number;
  channels?: number;
  inputCodec?: string;
}

interface AudioConfig {
  activeProfile: string;
  port?: number;
  profiles: Record<string, AudioProfile>;
}

function loadConfig(): { port: number; sourceConfig: AudioSourceConfig } {
  const configPath = process.env.AUDIO_CONFIG
    ?? resolve(process.cwd(), 'audio-config.json');

  let config: AudioConfig;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    console.warn(`[audio-streamer] Could not load ${configPath}, falling back to env vars`);
    return {
      port: parseInt(process.env.PORT ?? '3200', 10),
      sourceConfig: { device: process.env.AUDIO_DEVICE ?? 'hw:0,0' },
    };
  }

  const profileName = process.env.AUDIO_PROFILE ?? config.activeProfile;
  const profile = config.profiles[profileName];

  if (!profile) {
    const available = Object.keys(config.profiles).join(', ');
    throw new Error(`Profile "${profileName}" not found. Available: ${available}`);
  }

  console.log(`[audio-streamer] Using profile: ${profileName}`);

  return {
    port: parseInt(process.env.PORT ?? String(config.port ?? 3200), 10),
    sourceConfig: {
      device: profile.device,
      sampleRate: profile.sampleRate,
      channels: profile.channels,
      inputCodec: profile.inputCodec,
    },
  };
}

async function main() {
  const { port, sourceConfig } = loadConfig();
  const audioSource = new AudioSource(sourceConfig);

  const server = createServer(audioSource);

  server.listen(port, () => {
    console.log(`[audio-streamer] Listening on port ${port}`);
    console.log(`[audio-streamer] ALSA device: ${sourceConfig.device}`);
    if (sourceConfig.inputCodec) {
      console.log(`[audio-streamer] Input codec: ${sourceConfig.inputCodec}`);
    }
    console.log(`[audio-streamer] PCM: ${audioSource.sampleRate}Hz ${audioSource.channels}ch 16-bit`);
  });

  audioSource.start();

  const shutdown = () => {
    console.log('[audio-streamer] Shutting down...');
    audioSource.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[audio-streamer] Fatal error:', err);
  process.exit(1);
});
