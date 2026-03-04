import type { FrameProviderConfig } from "./config.js";
import { DeviceFrameProvider } from "./device-provider.js";
import type { FrameProvider } from "./frame-provider.js";
import { HttpFrameProvider } from "./http-provider.js";

export function createFrameProvider(
  config: FrameProviderConfig,
): FrameProvider {
  switch (config.type) {
    case "device":
      return new DeviceFrameProvider(config);
    case "http":
      return new HttpFrameProvider(config);
  }
}
