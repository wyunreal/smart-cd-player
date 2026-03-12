import { MediasoupManager } from './mediasoup-mgr.js';
import { AudioSource } from './audio-source.js';
import { createServer } from './server.js';

const PORT = parseInt(process.env.PORT ?? '3200', 10);
const ANNOUNCED_IP = process.env.ANNOUNCED_IP ?? '127.0.0.1';
const AUDIO_DEVICE = process.env.AUDIO_DEVICE ?? 'hw:0,0';
const MIN_PORT = parseInt(process.env.MEDIASOUP_MIN_PORT ?? '20000', 10);
const MAX_PORT = parseInt(process.env.MEDIASOUP_MAX_PORT ?? '20100', 10);

async function main() {
  const msManager = new MediasoupManager({
    announcedIp: ANNOUNCED_IP,
    minPort: MIN_PORT,
    maxPort: MAX_PORT,
  });

  await msManager.init();

  const audioSource = new AudioSource({
    device: AUDIO_DEVICE,
    rtpPort: msManager.rtpListenPort,
  });

  const server = createServer(msManager);

  server.listen(PORT, () => {
    console.log(`[audio-streamer] Listening on port ${PORT}`);
    console.log(`[audio-streamer] Announced IP: ${ANNOUNCED_IP}`);
    console.log(`[audio-streamer] ALSA device: ${AUDIO_DEVICE}`);
    console.log(`[audio-streamer] WebRTC ports: ${MIN_PORT}-${MAX_PORT}`);
  });

  audioSource.start();

  const shutdown = async () => {
    console.log('[audio-streamer] Shutting down...');
    audioSource.stop();
    await msManager.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[audio-streamer] Fatal error:', err);
  process.exit(1);
});
