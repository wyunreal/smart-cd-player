import { createServer, type Server } from 'node:http';

import sharp from 'sharp';

import type { DetectionResult } from './digit-detector.js';
import type { FrameProvider } from './frame-provider.js';

export interface DigitState {
  digits: DetectionResult[];
  timestamp: number;
}

interface ServerDeps {
  port: number;
  frameProvider: FrameProvider;
  getState: () => DigitState;
  frameWidth: number;
  frameHeight: number;
}

export function createHttpServer(deps: ServerDeps): Server {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${deps.port}`);

    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    switch (url.pathname) {
      case '/digits': {
        const state = deps.getState();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(state));
        break;
      }

      case '/frame': {
        const frame = deps.frameProvider.getLatestFrame();
        if (!frame) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No frame available yet' }));
          return;
        }

        try {
          const png = await sharp(frame, {
            raw: {
              width: deps.frameWidth,
              height: deps.frameHeight,
              channels: 3,
            },
          })
            .png()
            .toBuffer();

          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': png.length,
          });
          res.end(png);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: msg }));
        }
        break;
      }

      case '/health': {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        break;
      }

      default: {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    }
  });

  return server;
}
