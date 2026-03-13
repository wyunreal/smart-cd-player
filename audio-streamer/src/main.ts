import { AudioSource } from './audio-source.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT ?? '3200', 10);
const AUDIO_DEVICE = process.env.AUDIO_DEVICE ?? 'hw:0,0';

async function main() {
  const audioSource = new AudioSource({ device: AUDIO_DEVICE });

  const server = createServer(audioSource);

  server.listen(PORT, () => {
    console.log(`[audio-streamer] Listening on port ${PORT}`);
    console.log(`[audio-streamer] ALSA device: ${AUDIO_DEVICE}`);
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
