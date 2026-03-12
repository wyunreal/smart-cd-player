import express from 'express';
import { createServer as createHttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import path from 'path';
import type { WebRtcTransport, Consumer } from 'mediasoup/types';
import { MediasoupManager } from './mediasoup-mgr.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ClientState {
  transport?: WebRtcTransport;
  consumer?: Consumer;
}

export function createServer(msManager: MediasoupManager) {
  const app = express();
  const httpServer = createHttpServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', producerReady: msManager.isProducerReady });
  });

  wss.on('connection', (ws: WebSocket) => {
    const state: ClientState = {};

    ws.on('message', async (raw) => {
      let msg: { type: string; [key: string]: unknown };
      try {
        msg = JSON.parse(raw.toString()) as typeof msg;
      } catch {
        return;
      }

      try {
        await handleMessage(ws, msg, state, msManager);
      } catch (err) {
        console.error(`[ws] Error handling ${msg.type}:`, err);
        send(ws, { type: 'error', message: String(err) });
      }
    });

    ws.on('close', () => {
      state.transport?.close();
    });

    // Immediately tell the client whether audio is live
    send(ws, { type: 'serverState', producerReady: msManager.isProducerReady });
  });

  return httpServer;
}

async function handleMessage(
  ws: WebSocket,
  msg: { type: string; [key: string]: unknown },
  state: ClientState,
  ms: MediasoupManager,
) {
  switch (msg.type) {
    case 'getRouterRtpCapabilities': {
      send(ws, { type: 'routerRtpCapabilities', rtpCapabilities: ms.rtpCapabilities });
      break;
    }

    case 'createWebRtcTransport': {
      const t = await ms.createWebRtcTransport();
      state.transport = t;
      send(ws, {
        type: 'webRtcTransportCreated',
        id: t.id,
        iceParameters: t.iceParameters,
        iceCandidates: t.iceCandidates,
        dtlsParameters: t.dtlsParameters,
      });
      break;
    }

    case 'connectWebRtcTransport': {
      if (!state.transport) throw new Error('No transport');
      await ms.connectWebRtcTransport(
        state.transport,
        msg.dtlsParameters as Parameters<typeof ms.connectWebRtcTransport>[1],
      );
      send(ws, { type: 'webRtcTransportConnected' });
      break;
    }

    case 'consume': {
      if (!state.transport) throw new Error('No transport');
      const consumer = await ms.createConsumer(
        state.transport,
        msg.rtpCapabilities as Parameters<typeof ms.createConsumer>[1],
      );
      if (!consumer) {
        send(ws, { type: 'consumeFailed', reason: 'Producer not ready or incompatible caps' });
        break;
      }
      state.consumer = consumer;
      send(ws, {
        type: 'consumed',
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
      break;
    }

    case 'resumeConsumer': {
      if (!state.consumer) throw new Error('No consumer');
      await state.consumer.resume();
      send(ws, { type: 'consumerResumed' });
      break;
    }

    default:
      console.warn(`[ws] Unknown message type: ${msg.type}`);
  }
}

function send(ws: WebSocket, data: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}
