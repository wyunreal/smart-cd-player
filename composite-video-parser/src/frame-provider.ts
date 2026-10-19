import { EventEmitter } from "node:events";

export interface FrameProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: "frame", listener: (frame: Buffer) => void): void;
  off(event: "frame", listener: (frame: Buffer) => void): void;
  getLatestFrame(): Buffer | null;
  captureFrame(): Promise<Buffer>;
  getLastError(): string | null;
}

export interface FrameProviderBase {
  emitter: EventEmitter;
  getLatestFrame: () => Buffer | null;
  setFrame: (frame: Buffer) => void;
  setError: (message: string) => void;
  clearError: () => void;
  getLastError: () => string | null;
}

export const createFrameProviderBase = (): FrameProviderBase => {
  const emitter = new EventEmitter();
  let latestFrame: Buffer | null = null;
  let lastError: string | null = null;

  return {
    emitter,
    getLatestFrame: () => latestFrame,
    setFrame: (frame: Buffer) => {
      latestFrame = frame;
      lastError = null;
      emitter.emit("frame", frame);
    },
    setError: (message: string) => {
      lastError = message;
    },
    clearError: () => {
      lastError = null;
    },
    getLastError: () => lastError,
  };
};
