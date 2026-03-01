import { EventEmitter } from 'node:events';

import type { FrameProviderConfig } from './config.js';
import { DeviceFrameProvider } from './device-provider.js';
import { HttpFrameProvider } from './http-provider.js';

export interface FrameProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: 'frame', listener: (frame: Buffer) => void): this;
  off(event: 'frame', listener: (frame: Buffer) => void): this;
  getLatestFrame(): Buffer | null;
}

export abstract class BaseFrameProvider
  extends EventEmitter
  implements FrameProvider
{
  protected latestFrame: Buffer | null = null;

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  getLatestFrame(): Buffer | null {
    return this.latestFrame;
  }

  protected setFrame(frame: Buffer): void {
    this.latestFrame = frame;
    this.emit('frame', frame);
  }
}

export function createFrameProvider(config: FrameProviderConfig): FrameProvider {
  switch (config.type) {
    case 'device':
      return new DeviceFrameProvider(config);
    case 'http':
      return new HttpFrameProvider(config);
  }
}
