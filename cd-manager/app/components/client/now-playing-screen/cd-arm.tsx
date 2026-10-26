"use client";

import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CompactDiskAudioLogo from "./compact-disk-audio-logo";

/**
 * Static clamp arm that sits on top of the spinning disc, like the mechanism
 * of a CD player. It is a flat metal plate with a constant width, and carries
 * the Compact Disc logo at the rotation axis.
 */
const CdArm = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const white = theme.palette.common.white;
  const black = theme.palette.common.black;
  const grey = theme.palette.grey;

  const armBackground = isDark
    ? `linear-gradient(135deg, ${grey[900]} 0%, ${grey[600]} 15%, ${grey[300]} 38%, ${grey[100]} 48%, ${grey[400]} 62%, ${grey[700]} 82%, ${grey[900]} 100%)`
    : `linear-gradient(135deg, ${grey[600]} 0%, ${grey[300]} 15%, ${grey[100]} 38%, ${white} 48%, ${grey[200]} 62%, ${grey[500]} 82%, ${grey[700]} 100%)`;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      {/* Flat metal arm, constant width from the top to below the centre */}
      <Box
        sx={{
          position: "absolute",
          // On desktop the arm is long enough to stay clipped under the app
          // bar together with the well slot while the disc is centred.
          top: { xs: "-14%", sm: "-24%", lg: "-96%" },
          bottom: "38%",
          left: "50%",
          width: "26%",
          transform: "translate3d(-50%, 0, 0)",
          borderRadius: "4px",
          background: armBackground,
          border: `1px solid ${alpha(white, isDark ? 0.2 : 0.65)}`,
          boxShadow: `0 8px 18px ${alpha(
            black,
            isDark ? 0.45 : 0.2,
          )}, inset 1px 0 0 ${alpha(white, 0.55)}, inset -1px 0 0 ${alpha(
            black,
            0.55,
          )}, inset 0 1px 0 ${alpha(white, 0.4)}, inset 0 -1px 0 ${alpha(
            black,
            0.45,
          )}`,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "10%",
            borderRadius: "4px 0 0 4px",
            background: `linear-gradient(90deg, ${alpha(
              white,
              isDark ? 0.22 : 0.5,
            )}, transparent 80%)`,
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "12%",
            borderRadius: "0 4px 4px 0",
            background: `linear-gradient(270deg, ${alpha(
              black,
              isDark ? 0.55 : 0.3,
            )}, transparent 85%)`,
            pointerEvents: "none",
          },
        }}
      />

      {/* Compact Disc logo plaque, centred on the rotation axis */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "24%",
          height: "17.5%",
          transform: "translate3d(-50%, -50%, 0)",
          borderRadius: "5px",
          background: `linear-gradient(145deg, ${grey[900]} 0%, ${black} 70%)`,
          border: `1px solid ${alpha(white, 0.28)}`,
          boxShadow: `inset 0 1px 3px ${alpha(
            white,
            0.18,
          )}, inset 0 -2px 5px ${alpha(black, 0.8)}, 0 1px 2px ${alpha(
            white,
            0.18,
          )}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "45%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CompactDiskAudioLogo />
        </Box>
      </Box>
    </Box>
  );
};

export default CdArm;
