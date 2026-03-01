import { readFile } from 'node:fs/promises';

export interface RectConfig {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DeviceProviderConfig {
  type: 'device';
  device: string;
  width: number;
  height: number;
  fps: number;
}

export interface HttpProviderConfig {
  type: 'http';
  url: string;
  width: number;
  height: number;
  fps: number;
}

export type FrameProviderConfig = DeviceProviderConfig | HttpProviderConfig;

export interface ServerConfig {
  port: number;
}

export interface Config {
  frameProvider: FrameProviderConfig;
  rects: RectConfig[];
  server: ServerConfig;
}

export async function loadConfig(): Promise<Config> {
  const configPath = process.env['CONFIG_PATH'] ?? 'config.json';
  const raw = await readFile(configPath, 'utf-8');
  return JSON.parse(raw) as Config;
}
