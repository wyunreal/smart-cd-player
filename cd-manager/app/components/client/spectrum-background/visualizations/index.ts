import type { SpectrumVisualization } from "./types";
import bars from "./bars";
import waveform from "./waveform";
import none from "./none";

export type { SpectrumVisualization, SpectrumVisualizationContext } from "./types";

export type VisualizationStyle = "bars" | "waveform" | "none";

const visualizations: Record<VisualizationStyle, SpectrumVisualization> = {
  bars,
  waveform,
  none,
};

export const visualizationStyles = Object.keys(visualizations) as VisualizationStyle[];

export const getVisualization = (style: VisualizationStyle): SpectrumVisualization =>
  visualizations[style];
