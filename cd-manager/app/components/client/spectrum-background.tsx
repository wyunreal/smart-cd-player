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

const CHILDREN_HIDE_DELAY_MS = 5000;
const CHILDREN_FADE_DURATION_MS = 600;
const AUDIO_SIGNAL_THRESHOLD = 5;

type SpectrumBackgroundProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const FREQ_MIN = 20;
const FREQ_MAX = 20000;

// Perceptual gain: attenuate mids, boost treble, leave bass untouched.
// Below 200 Hz: 1.0 (no change). Above 200 Hz: gentle power curve.
function perceptualGain(f: number): number {
  if (f <= 150) return 1.0;
  return Math.pow(f / 150, 0.18);
}

const SpectrumBackground = ({ children, sx }: SpectrumBackgroundProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const barCount = isMobile ? 16 : 32;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { analyserLeft, analyserRight } = useAudioStream();

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
    if (!container || !isAudioActive) {
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
  }, [isAudioActive, resetHideTimer]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserLeft || !analyserRight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const leftData = new Uint8Array(analyserLeft.frequencyBinCount);
    const rightData = new Uint8Array(analyserRight.frequencyBinCount);
    analyserLeft.getByteFrequencyData(leftData);
    analyserRight.getByteFrequencyData(rightData);

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

    const totalBars = barCount * 2;
    const barWidth = width / totalBars;

    const nyquist = analyserLeft.context.sampleRate / 2;
    const logMin = Math.log10(FREQ_MIN);
    const logMax = Math.log10(FREQ_MAX);

    const color = theme.palette.primary.main;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    for (let i = 0; i < barCount; i++) {
      const logFreqLow = logMin + (i / barCount) * (logMax - logMin);
      const logFreqHigh = logMin + ((i + 1) / barCount) * (logMax - logMin);
      const binLow = Math.max(1, Math.floor((Math.pow(10, logFreqLow) / nyquist) * leftData.length));
      const binHigh = Math.max(binLow + 1, Math.ceil((Math.pow(10, logFreqHigh) / nyquist) * leftData.length));

      const centerFreq = Math.pow(10, (logFreqLow + logFreqHigh) / 2);
      const gain = perceptualGain(centerFreq);
      const count = Math.max(1, binHigh - binLow);

      // Left channel
      let sumL = 0;
      for (let j = binLow; j < binHigh && j < leftData.length; j++) {
        sumL += leftData[j];
      }
      const valueL = Math.min(255, (sumL / count) * gain);
      const barHeightL = (valueL / 255) * height;
      const opacityL = 0.15 + (valueL / 255) * 0.45;

      // Right channel
      let sumR = 0;
      for (let j = binLow; j < binHigh && j < rightData.length; j++) {
        sumR += rightData[j];
      }
      const valueR = Math.min(255, (sumR / count) * gain);
      const barHeightR = (valueR / 255) * height;
      const opacityR = 0.15 + (valueR / 255) * 0.45;

      // Left half: left channel, frequencies inverted (high at edge, low at center)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityL})`;
      ctx.fillRect((barCount - 1 - i) * barWidth, height - barHeightL, barWidth - 1, barHeightL);
      // Right half: right channel (low at center, high at edge)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityR})`;
      ctx.fillRect((barCount + i) * barWidth, height - barHeightR, barWidth - 1, barHeightR);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [theme.palette.primary.main, barCount, analyserLeft, analyserRight]);

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
      sx={{
        position: "relative",
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
