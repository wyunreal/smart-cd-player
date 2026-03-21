import type { SpectrumVisualization } from "./types";
import bars from "./bars";
import mirrorBars from "./mirror-bars";
import solidBars from "./solid-bars";
import solidMirrorBars from "./solid-mirror-bars";
import ledBars from "./led-bars";
import ledMirrorBars from "./led-mirror-bars";
import waveform from "./waveform";
import none from "./none";

export type { SpectrumVisualization, SpectrumVisualizationContext } from "./types";

export type VisualizationStyle = "bars" | "mirrorBars" | "solidBars" | "solidMirrorBars" | "ledBars" | "ledMirrorBars" | "waveform" | "none";

const visualizations: Record<VisualizationStyle, SpectrumVisualization> = {
  bars,
  mirrorBars,
  solidBars,
  solidMirrorBars,
  ledBars,
  ledMirrorBars,
  waveform,
  none,
};

export const visualizationStyles = Object.keys(visualizations) as VisualizationStyle[];

export const getVisualization = (style: VisualizationStyle): SpectrumVisualization =>
  visualizations[style];
