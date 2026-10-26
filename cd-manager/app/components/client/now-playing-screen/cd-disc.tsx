"use client";

/* eslint-disable @next/next/no-img-element */
import { memo } from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";

/**
 * A real CD spins at roughly 200-500 rpm. 0.15s per revolution is 400 rpm,
 * which lands in the middle of the range.
 */
const DISC_SPIN_SECONDS = 0.15;

const spin = keyframes`
  from {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  to {
    transform: translate3d(0, 0, 0) rotate(360deg);
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

  const discRim = isDark
    ? `linear-gradient(145deg, ${grey[900]} 0%, ${grey[600]} 38%, ${grey[900]} 66%, ${grey[700]} 100%)`
    : `linear-gradient(145deg, ${grey[100]} 0%, ${grey[400]} 36%, ${grey[200]} 58%, ${grey[500]} 100%)`;

  const rimHighlight = alpha(white, isDark ? 0.28 : 0.9);
  const discShadow = `${theme.shadows[8]}, 0 0 45px ${alpha(accent, 0.18)}`;
  const hubBackground = isDark
    ? `radial-gradient(circle at 38% 32%, ${grey[500]} 0%, ${grey[800]} 30%, ${grey[900]} 62%, ${black} 100%)`
    : `radial-gradient(circle at 38% 32%, ${grey[300]} 0%, ${grey[500]} 28%, ${grey[700]} 62%, ${grey[900]} 100%)`;

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
      {/* Ambient glow around the disc */}
      <Box
        sx={{
          position: "absolute",
          inset: "-7%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(
            accent,
            isDark ? 0.35 : 0.22,
          )} 0%, transparent 68%)`,
          filter: "blur(28px)",
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
            animationPlayState: spinning ? "running" : "paused",
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

          {/* Holographic diffraction, fixed to the disc face */}
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
              mixBlendMode: "screen",
              opacity: isDark ? 0.72 : 0.6,
              pointerEvents: "none",
            }}
          />

          {/* Soft silver wash on the centre of the disc */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(circle at 50% 42%, ${alpha(
                white,
                0.32,
              )} 0%, ${alpha(white, 0.08)} 34%, transparent 62%)`,
              mixBlendMode: "screen",
              opacity: 0.55,
              pointerEvents: "none",
            }}
          />
        </Box>

        {/* Static light reflection, as if the light source did not move */}
        <Box
          sx={{
            position: "absolute",
            inset: "2.2%",
            borderRadius: "50%",
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
            mixBlendMode: "screen",
            opacity: isDark ? 0.75 : 0.6,
            pointerEvents: "none",
          }}
        />

        {/* Inner edge shadow */}
        <Box
          sx={{
            position: "absolute",
            inset: "2.2%",
            borderRadius: "50%",
            boxShadow: `inset 0 0 26px ${alpha(
              black,
              0.35,
            )}, inset 0 0 2px ${alpha(white, 0.35)}`,
            pointerEvents: "none",
          }}
        />

        {/* Centre hub */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "19%",
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: hubBackground,
            border: `1px solid ${alpha(white, isDark ? 0.45 : 0.85)}`,
            boxShadow: `inset 0 2px 4px ${alpha(
              white,
              0.28,
            )}, inset 0 -3px 6px ${alpha(black, 0.55)}, 0 2px 10px ${alpha(
              black,
              0.45,
            )}`,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: "16%",
              borderRadius: "50%",
              border: `1px solid ${alpha(white, 0.18)}`,
              boxShadow: `inset 0 1px 3px ${alpha(black, 0.55)}`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "44%",
              aspectRatio: "1",
              transform: "translate(-50%, -50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 35%, ${grey[800]} 0%, ${black} 70%)`,
              border: `1px solid ${alpha(white, 0.14)}`,
              boxShadow: `inset 0 1px 4px ${alpha(
                black,
                0.9,
              )}, 0 1px 2px ${alpha(white, 0.12)}`,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${alpha(
                white,
                0.3,
              )} 0%, ${alpha(white, 0.05)} 28%, transparent 48%)`,
              pointerEvents: "none",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default memo(CdDisc);
