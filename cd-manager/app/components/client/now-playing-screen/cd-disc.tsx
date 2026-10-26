"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import CdArm from "./cd-arm";
import CdWell from "./cd-well";

/**
 * A real CD spins at roughly 200-500 rpm. 0.15s per revolution is 400 rpm,
 * which lands in the middle of the range.
 */
const DISC_SPIN_SECONDS = 0.15;

const spin = keyframes`
  from {
    transform: translate3d(0, 0, 0) rotate3d(0, 0, 1, 0deg);
  }
  to {
    transform: translate3d(0, 0, 0) rotate3d(0, 0, 1, 360deg);
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
        {/* Rotating face: the album art and its iridescent treatment */}
        <Box
          sx={{
            position: "absolute",
            inset: "2.2%",
            borderRadius: "50%",
            overflow: "hidden",
            transformOrigin: "50% 50%",
            backfaceVisibility: "hidden",
            isolation: "isolate",
            contain: "paint",
            animation: `${spin} ${DISC_SPIN_SECONDS}s linear infinite`,
            animationPlayState: shouldSpin ? "running" : "paused",
            willChange: "transform",
            "@media (prefers-reduced-motion: reduce)": {
              animation: "none",
            },
          }}
        >
          <img
            src={imageSrc}
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

        {/* Static clamp arm and Compact Disc logo */}
        <CdArm />
      </Box>
    </Box>
  );
};

export default memo(CdDisc);
