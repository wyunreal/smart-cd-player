import type { SpectrumVisualization } from "./types";
import bars from "./bars";
import waveform from "./waveform";

export type { SpectrumVisualization, SpectrumVisualizationContext } from "./types";

export type VisualizationStyle = "bars" | "waveform";

const visualizations: Record<VisualizationStyle, SpectrumVisualization> = {
  bars,
  waveform,
};

export const getVisualization = (style: VisualizationStyle): SpectrumVisualization =>
  visualizations[style];
