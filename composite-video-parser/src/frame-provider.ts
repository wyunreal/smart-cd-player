import { EventEmitter } from "node:events";

export interface FrameProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: "frame", listener: (frame: Buffer) => void): void;
  off(event: "frame", listener: (frame: Buffer) => void): void;
  getLatestFrame(): Buffer | null;
  captureFrame(): Promise<Buffer>;
}

export interface FrameProviderBase {
  emitter: EventEmitter;
  getLatestFrame: () => Buffer | null;
  setFrame: (frame: Buffer) => void;
}

export const createFrameProviderBase = (): FrameProviderBase => {
  const emitter = new EventEmitter();
  let latestFrame: Buffer | null = null;

  return {
    emitter,
    getLatestFrame: () => latestFrame,
    setFrame: (frame: Buffer) => {
      latestFrame = frame;
      emitter.emit("frame", frame);
    },
  };
};
