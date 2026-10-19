import type { FrameProviderConfig } from "./config.js";
import { createDeviceProvider, type ProviderOptions } from "./device-provider.js";
import type { FrameProvider } from "./frame-provider.js";
import { createHttpProvider } from "./http-provider.js";

export const createFrameProvider = (
  config: FrameProviderConfig,
  options: ProviderOptions = {},
): FrameProvider => {
  switch (config.type) {
    case "device":
      return createDeviceProvider(config, options);
    case "http":
      return createHttpProvider(config, options);
  }
};
