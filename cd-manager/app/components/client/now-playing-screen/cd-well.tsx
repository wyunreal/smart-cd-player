"use client";

import { Box, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";

type WellVariant = "xs" | "sm" | "lg";

type WellSvgProps = {
  theme: Theme;
  variant: WellVariant;
  slotTop: number;
  halfWidth: number;
};

const WELL_CENTER = 50;
const WELL_RADIUS = 57;
const WELL_BOTTOM = 107;
const WELL_LEFT = -7;
const WELL_WIDTH = 114;

const WellSvg = ({
  theme,
  variant,
  slotTop,
  halfWidth,
}: WellSvgProps) => {
  const isDark = theme.palette.mode === "dark";
  const white = theme.palette.common.white;
  const black = theme.palette.common.black;
  const grey = theme.palette.grey;

  const intersection =
    WELL_CENTER - Math.sqrt(WELL_RADIUS ** 2 - halfWidth ** 2);
  const topRadius = Math.max(
    1.5,
    Math.min(9, (intersection - slotTop) / 3),
  );
  const left = WELL_CENTER - halfWidth;
  const right = WELL_CENTER + halfWidth;

  // One closed path: the slot sides flow into the circle at the intersection,
  // then the border wraps the whole disc well without any internal seam.
  const path = [
    `M ${left} ${intersection}`,
    `A ${WELL_RADIUS} ${WELL_RADIUS} 0 1 0 ${right} ${intersection}`,
    `L ${right} ${slotTop + topRadius}`,
    `Q ${right} ${slotTop} ${right - topRadius} ${slotTop}`,
    `L ${left + topRadius} ${slotTop}`,
    `Q ${left} ${slotTop} ${left} ${slotTop + topRadius}`,
    "Z",
  ].join(" ");

  const height = WELL_BOTTOM - slotTop;
  const viewBox = `${WELL_LEFT} ${slotTop} ${WELL_WIDTH} ${height}`;

  const floorId = `well-floor-${variant}`;
  const rimId = `well-rim-${variant}`;
  const shadowId = `well-shadow-${variant}`;
  const lightId = `well-light-${variant}`;
  const clipId = `well-clip-${variant}`;

  const display =
    variant === "xs"
      ? ({ xs: "block", sm: "none" } as const)
      : variant === "sm"
        ? ({ xs: "none", sm: "block", lg: "none" } as const)
        : ({ xs: "none", lg: "block" } as const);

  return (
    <Box
      sx={{
        position: "absolute",
        top: `${slotTop}%`,
        left: `${WELL_LEFT}%`,
        width: `${WELL_WIDTH}%`,
        height: `${height}%`,
        display,
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={floorId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={isDark ? black : grey[500]}
            />
            <stop
              offset="100%"
              stopColor={
                isDark ? theme.palette.background.default : grey[300]
              }
            />
          </linearGradient>

          <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isDark ? (
              <>
                <stop offset="0%" stopColor={grey[900]} />
                <stop offset="30%" stopColor={grey[500]} />
                <stop offset="52%" stopColor={grey[200]} />
                <stop offset="74%" stopColor={grey[600]} />
                <stop offset="100%" stopColor={grey[300]} />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor={grey[700]} />
                <stop offset="30%" stopColor={grey[300]} />
                <stop offset="52%" stopColor={white} />
                <stop offset="74%" stopColor={grey[500]} />
                <stop offset="100%" stopColor={white} />
              </>
            )}
          </linearGradient>

          <linearGradient id={shadowId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor={black}
              stopOpacity={isDark ? 0.8 : 0.3}
            />
            <stop offset="55%" stopColor={black} stopOpacity="0" />
            <stop offset="100%" stopColor={black} stopOpacity="0" />
          </linearGradient>

          <linearGradient id={lightId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={white} stopOpacity="0" />
            <stop offset="45%" stopColor={white} stopOpacity="0" />
            <stop
              offset="100%"
              stopColor={white}
              stopOpacity={isDark ? 0.14 : 0.8}
            />
          </linearGradient>

          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>

        <path d={path} fill={`url(#${floorId})`} />

        <g clipPath={`url(#${clipId})`}>
          <path
            d={path}
            fill="none"
            stroke={`url(#${shadowId})`}
            strokeWidth="12"
            vectorEffect="non-scaling-stroke"
            opacity="0.6"
          />
          <path
            d={path}
            fill="none"
            stroke={`url(#${lightId})`}
            strokeWidth="6"
            vectorEffect="non-scaling-stroke"
            opacity="0.5"
          />
          <path
            d={path}
            fill="none"
            stroke={`url(#${rimId})`}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </Box>
  );
};

/**
 * Recessed well behind the disc and the clamp arm. It is one closed shape:
 * a circular well for the disc plus a slot for the arm, with a continuous
 * inner border and no internal seams.
 */
const CdWell = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        // The stacked layout shows the bare spinning disc, without the
        // recessed well of the desktop player.
        display: { xs: "none", sm: "none", lg: "block" },
      }}
    >
      <WellSvg
        theme={theme}
        variant="xs"
        slotTop={-8}
        halfWidth={24}
      />
      <WellSvg
        theme={theme}
        variant="sm"
        slotTop={-26}
        halfWidth={31}
      />
      {/* Desktop: the slot is longer than the arm so its top is clipped by
          the app bar while the disc stays vertically centred. */}
      <WellSvg
        theme={theme}
        variant="lg"
        slotTop={-100}
        halfWidth={35}
      />
    </Box>
  );
};

export default CdWell;
