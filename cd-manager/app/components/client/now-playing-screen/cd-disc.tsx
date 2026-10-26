"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useEffect, useRef, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import CdArm from "./cd-arm";
import CdWell from "./cd-well";

/** Seconds per revolution. */
const DISC_SPIN_SECONDS = 0.4;

/**
 * Baked rotational motion blur. A real disc smears along concentric circles
 * during the exposure; averaging several slightly rotated copies of the face
 * gives the same radial blur while the compositor still rotates one texture.
 */
const MAX_FACE_TEXTURE_SIZE = 1024;
const MOTION_BLUR_SAMPLES = 16;
/** One frame of exposure at 60 Hz: 360° / 60 / spin duration. */
const MOTION_BLUR_DEGREES = 6 / DISC_SPIN_SECONDS;

/**
 * Blurred face textures are pure data derived from the artwork, so keep them
 * in memory. Switching back to a previously seen album reuses the image
 * instead of rasterising the blur again.
 */
const blurredFaceCache = new Map<string, string>();
const MAX_BLURRED_FACE_CACHE = 12;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

type CdDiscProps = {
  imageSrc: string;
  spinning: boolean;
};

const CdDisc = ({ imageSrc, spinning }: CdDiscProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = theme.palette.primary.main;
  const white = theme.palette.common.white;
  const black = theme.palette.common.black;
  const grey = theme.palette.grey;
  const extra = theme.palette.extra;

  const [documentVisible, setDocumentVisible] = useState(true);
  const [blurredSrc, setBlurredSrc] = useState<string | null>(null);
  const faceImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  // Bake a rotational (tangential) motion blur into the face texture. Drawing
  // the art several times with a small rotation offset around the centre and
  // averaging with "lighter" produces the same radial smear a real disc has.
  // The result is turned back into a plain image so the compositor rotates a
  // static texture instead of keeping a canvas layer alive every frame.
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setBlurredSrc(null);
      return;
    }

    const blurDegrees = MOTION_BLUR_DEGREES;
    const samples = MOTION_BLUR_SAMPLES;
    const step = blurDegrees / Math.max(1, samples - 1);

    const displayWidth = faceImageRef.current?.clientWidth || 512;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(
      256,
      Math.min(MAX_FACE_TEXTURE_SIZE, Math.round(displayWidth * dpr)),
    );
    const cacheKey = `${imageSrc}::${size}::${samples}::${blurDegrees}`;
    const cached = blurredFaceCache.get(cacheKey);

    if (cached) {
      setBlurredSrc(cached);
      return;
    }

    let cancelled = false;
    const image = new window.Image();

    // Show the sharp original while the blurred texture is being generated.
    setBlurredSrc(null);

    image.onload = () => {
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = Math.max(
        size / image.naturalWidth,
        size / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1 / samples;

      for (let i = 0; i < samples; i++) {
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((-i * step * Math.PI) / 180);
        ctx.drawImage(image, x - size / 2, y - size / 2, width, height);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      try {
        const blurred = canvas.toDataURL("image/jpeg", 0.92);
        blurredFaceCache.set(cacheKey, blurred);

        if (blurredFaceCache.size > MAX_BLURRED_FACE_CACHE) {
          const oldest = blurredFaceCache.keys().next().value;
          if (oldest) blurredFaceCache.delete(oldest);
        }

        setBlurredSrc(blurred);
      } catch {
        // Cross-origin artwork taints the canvas; keep the sharp original.
      }
    };

    image.src = imageSrc;

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [imageSrc]);

  const shouldSpin = spinning && documentVisible;

  const discRim = isDark
    ? `linear-gradient(145deg, ${grey[900]} 0%, ${grey[600]} 38%, ${grey[900]} 66%, ${grey[700]} 100%)`
    : `linear-gradient(145deg, ${grey[100]} 0%, ${grey[400]} 36%, ${grey[200]} 58%, ${grey[500]} 100%)`;

  const rimHighlight = alpha(white, isDark ? 0.28 : 0.9);
  const discShadow = theme.shadows[8];

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        pointerEvents: "none",
      }}
    >
      <CdWell />

      {/* Ambient glow around the disc */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(
            accent,
            isDark ? 0.35 : 0.22,
          )} 0%, ${alpha(accent, isDark ? 0.18 : 0.12)} 35%, ${alpha(
            accent,
            0.04,
          )} 55%, transparent 75%)`,
          opacity: 0.8,
          pointerEvents: "none",
        }}
      />

      {/* Rim and metallic edge */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: discRim,
          border: `1px solid ${rimHighlight}`,
          boxShadow: discShadow,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: "0.7%",
            borderRadius: "50%",
            border: `1px solid ${rimHighlight}`,
            opacity: 0.55,
            pointerEvents: "none",
          },
        }}
      >
        {/* Static clipping frame. The rotating face is a square whose
            transformed bounding box grows while it spins, so it must be
            clipped here to keep it from extending the page's scrollable
            area (which flickered a horizontal scrollbar). */}
        <Box
          sx={{
            position: "absolute",
            inset: "2.2%",
            borderRadius: "50%",
            overflow: "hidden",
            contain: "paint",
            pointerEvents: "none",
          }}
        >
          {/* Rotating face: the album art and its iridescent treatment */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              transformOrigin: "50% 50%",
              backfaceVisibility: "hidden",
              isolation: "isolate",
              animation: `${spin} ${DISC_SPIN_SECONDS}s linear infinite`,
              animationPlayState: shouldSpin ? "running" : "paused",
              willChange: "transform",
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
              },
            }}
          >
            <img
              ref={faceImageRef}
              src={blurredSrc ?? imageSrc}
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* All face effects are baked into the rotating layer, so the
              compositor rotates a single texture instead of blending several
              static layers over a moving backdrop. */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `conic-gradient(from 215deg at 50% 50%, transparent 0deg, ${alpha(
                  extra[1],
                  0.32,
                )} 32deg, ${alpha(white, 0.5)} 60deg, ${alpha(
                  extra[4],
                  0.26,
                )} 92deg, transparent 132deg, transparent 206deg, ${alpha(
                  extra[2],
                  0.28,
                )} 246deg, ${alpha(extra[3], 0.24)} 274deg, ${alpha(
                  white,
                  0.38,
                )} 304deg, transparent 344deg)`,
                opacity: isDark ? 0.72 : 0.6,
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(circle at 50% 42%, ${alpha(
                  white,
                  0.32,
                )} 0%, ${alpha(white, 0.08)} 34%, transparent 62%)`,
                opacity: 0.55,
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(118deg, transparent 16%, ${alpha(
                  white,
                  0.16,
                )} 38%, ${alpha(white, 0.38)} 45%, ${alpha(
                  white,
                  0.05,
                )} 51%, transparent 58%, transparent 72%, ${alpha(
                  white,
                  0.12,
                )} 86%, transparent 94%)`,
                opacity: isDark ? 0.75 : 0.6,
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                boxShadow: `inset 0 0 26px ${alpha(
                  black,
                  0.35,
                )}, inset 0 0 2px ${alpha(white, 0.35)}`,
                pointerEvents: "none",
              }}
            />
          </Box>
        </Box>

        {/* Static clamp arm and Compact Disc logo */}
        <CdArm />
      </Box>
    </Box>
  );
};

export default memo(CdDisc);
