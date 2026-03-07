import type { FrameProviderConfig } from "./config.js";
import { createDeviceProvider } from "./device-provider.js";
import type { FrameProvider } from "./frame-provider.js";
import { createHttpProvider } from "./http-provider.js";

export const createFrameProvider = (
  config: FrameProviderConfig,
): FrameProvider => {
  switch (config.type) {
    case "device":
      return createDeviceProvider(config);
    case "http":
      return createHttpProvider(config);
  }
};
