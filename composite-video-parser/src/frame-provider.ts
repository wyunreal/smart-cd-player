import { EventEmitter } from "node:events";

export interface FrameProvider {
  start(): Promise<void>;
  stop(): Promise<void>;
  on(event: "frame", listener: (frame: Buffer) => void): this;
  off(event: "frame", listener: (frame: Buffer) => void): this;
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
    this.emit("frame", frame);
  }
}
