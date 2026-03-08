"use client";

import { Box, type SxProps, type Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useRef, useEffect, useCallback } from "react";

type SpectrumBackgroundProps = {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const BAR_COUNT = 32;
const FFT_SIZE = 8192;
const FREQ_MIN = 20;
const FREQ_MAX = 18000;

const SpectrumBackground = ({ children, sx }: SpectrumBackgroundProps) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const totalBars = BAR_COUNT * 2;
    const barWidth = width / totalBars;

    const nyquist = analyser.context.sampleRate / 2;
    const logMin = Math.log10(FREQ_MIN);
    const logMax = Math.log10(FREQ_MAX);

    const color = theme.palette.primary.main;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    for (let i = 0; i < BAR_COUNT; i++) {
      const logFreqLow = logMin + (i / BAR_COUNT) * (logMax - logMin);
      const logFreqHigh = logMin + ((i + 1) / BAR_COUNT) * (logMax - logMin);
      // Clamp to bin 1 minimum to skip DC component (bin 0)
      const binLow = Math.max(1, Math.floor((Math.pow(10, logFreqLow) / nyquist) * dataArray.length));
      const binHigh = Math.max(binLow + 1, Math.ceil((Math.pow(10, logFreqHigh) / nyquist) * dataArray.length));

      let sum = 0;
      const count = Math.max(1, binHigh - binLow);
      for (let j = binLow; j < binHigh && j < dataArray.length; j++) {
        sum += dataArray[j];
      }
      const value = sum / count;
      const barHeight = (value / 255) * height;
      const opacity = 0.15 + (value / 255) * 0.45;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      // Left half: mirrored (high frequencies at edges, low at center)
      ctx.fillRect((BAR_COUNT - 1 - i) * barWidth, height - barHeight, barWidth - 1, barHeight);
      // Right half: normal (low at center, high at edges)
      ctx.fillRect((BAR_COUNT + i) * barWidth, height - barHeight, barWidth - 1, barHeight);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [theme.palette.primary.main]);

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

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;
        animationRef.current = requestAnimationFrame(draw);
      })
      .catch(() => {
        // Microphone not available or permission denied — render children without spectrum
      });

    return () => {
      cancelAnimationFrame(animationRef.current);
      observer.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [draw]);

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
      <Box
        sx={{
          position: "relative",
          flex: 1,
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SpectrumBackground;
