import express from 'express';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import type { AudioSource } from './audio-source.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer(audioSource: AudioSource) {
  const app = express();
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Send stream config as first message, then broadcast PCM chunks
  const clients = new Set<WebSocket>();

  const config = {
    type: 'config',
    codec: 'flac',
    sampleRate: audioSource.sampleRate,
    channels: audioSource.channels,
    bitDepth: 16,
  };

  wss.on('connection', (ws: WebSocket) => {
    console.log(`[ws] Client connected (${clients.size + 1} total)`);
    ws.send(JSON.stringify(config));
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[ws] Client disconnected (${clients.size} total)`);
    });
  });

  audioSource.on('data', (chunk: Buffer) => {
    for (const ws of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    }
  });

  return httpServer;
}
