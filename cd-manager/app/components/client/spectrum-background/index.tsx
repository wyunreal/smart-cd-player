"use client";

import {
  Box,
  Fade,
  type SxProps,
  type Theme,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useRef, useEffect, useCallback, useState } from "react";
import useAudioStream from "@/app/hooks/use-audio-stream";
import {
  getVisualization,
  visualizationStyles,
  type VisualizationStyle,
} from "./visualizations";

const CHILDREN_HIDE_DELAY_MS = 5000;
const CHILDREN_FADE_DURATION_MS = 600;
const AUDIO_SIGNAL_THRESHOLD = 5;
const STORAGE_KEY = "spectrum-visualization";

const loadVisualization = (): VisualizationStyle => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && visualizationStyles.includes(stored as VisualizationStyle)) {
      return stored as VisualizationStyle;
    }
  } catch {
    // silent fail
  }
  return visualizationStyles[0];
};

const saveVisualization = (style: VisualizationStyle) => {
  try {
    localStorage.setItem(STORAGE_KEY, style);
  } catch {
    // silent fail
  }
};

type SpectrumBackgroundProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const SpectrumBackground = ({
  children,
  sx,
}: SpectrumBackgroundProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const barCount = isMobile ? 16 : 32;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { analyserLeft, analyserRight } = useAudioStream();

  const [visualization, setVisualization] = useState<VisualizationStyle>(loadVisualization);

  const handleToggleVisualization = useCallback(() => {
    setVisualization((prev) => {
      const idx = visualizationStyles.indexOf(prev);
      const next = visualizationStyles[(idx + 1) % visualizationStyles.length];
      saveVisualization(next);
      return next;
    });
  }, []);

  const [isAudioActive, setIsAudioActive] = useState(false);
  const [childrenVisible, setChildrenVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const childrenContainerRef = useRef<HTMLDivElement>(null);
  const wasAudioActiveRef = useRef(false);

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
    }
    setChildrenVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setChildrenVisible(false);
      hideTimerRef.current = null;
    }, CHILDREN_HIDE_DELAY_MS);
  }, []);

  // Observe DOM mutations in children to detect content changes
  useEffect(() => {
    const container = childrenContainerRef.current;
    if (!container || !isAudioActive || visualization === "none") {
      // No audio → always show children, clear any pending timer
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      setChildrenVisible(true);
      return;
    }

    // Audio just became active — start the hide timer
    resetHideTimer();

    const observer = new MutationObserver(() => {
      resetHideTimer();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [isAudioActive, visualization, resetHideTimer]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserLeft || !analyserRight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const leftData = new Uint8Array(analyserLeft.frequencyBinCount);
    const rightData = new Uint8Array(analyserRight.frequencyBinCount);
    analyserLeft.getByteFrequencyData(leftData);
    analyserRight.getByteFrequencyData(rightData);

    const leftTimeDomain = new Uint8Array(analyserLeft.fftSize);
    const rightTimeDomain = new Uint8Array(analyserRight.fftSize);
    analyserLeft.getByteTimeDomainData(leftTimeDomain);
    analyserRight.getByteTimeDomainData(rightTimeDomain);

    // Detect real audio signal by checking if any frequency bin exceeds threshold
    let maxVal = 0;
    for (let i = 0; i < leftData.length; i++) {
      if (leftData[i] > maxVal) maxVal = leftData[i];
      if (maxVal >= AUDIO_SIGNAL_THRESHOLD) break;
    }
    if (maxVal < AUDIO_SIGNAL_THRESHOLD) {
      for (let i = 0; i < rightData.length; i++) {
        if (rightData[i] > maxVal) maxVal = rightData[i];
        if (maxVal >= AUDIO_SIGNAL_THRESHOLD) break;
      }
    }
    const hasSignal = maxVal >= AUDIO_SIGNAL_THRESHOLD;
    if (hasSignal !== wasAudioActiveRef.current) {
      wasAudioActiveRef.current = hasSignal;
      setIsAudioActive(hasSignal);
    }

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const color = theme.palette.primary.main;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const render = getVisualization(visualization);
    render({
      ctx,
      width,
      height,
      leftData,
      rightData,
      leftTimeDomain,
      rightTimeDomain,
      sampleRate: analyserLeft.context.sampleRate,
      barCount,
      color: { r, g, b },
      hasAudioSignal: hasSignal,
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [theme.palette.primary.main, barCount, analyserLeft, analyserRight, visualization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();

    if (analyserLeft && analyserRight) {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
    };
  }, [draw, analyserLeft, analyserRight]);

  return (
    <Box
      onClick={handleToggleVisualization}
      sx={{
        position: "relative",
        cursor: "pointer",
        ...sx,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <Fade in={childrenVisible} timeout={CHILDREN_FADE_DURATION_MS}>
        <Box
          ref={childrenContainerRef}
          sx={{
            position: "relative",
            flex: 1,
            zIndex: 1,
          }}
        >
          {children}
        </Box>
      </Fade>
    </Box>
  );
};

export default SpectrumBackground;
