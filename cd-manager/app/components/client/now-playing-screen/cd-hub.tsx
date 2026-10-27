"use client";

import { Box } from "@mui/material";
import CompactDiskAudioLogo from "./compact-disk-audio-logo";

/**
 * Static spindle cap in the middle of the disc. It uses the brushed aluminium
 * texture supplied for the project and carries the Compact Disc mark in black
 * directly on the metal, without a plaque or background.
 */
const CdHub = () => (
  <Box
    sx={{
      position: "absolute",
      inset: 0,
      zIndex: 3,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    }}
  >
    <Box
      sx={{
        width: "32%",
        aspectRatio: "1",
        borderRadius: "50%",
        backgroundImage: 'url("/mock/cd-hub-texture.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow:
          "0 9px 18px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "50%",
          lineHeight: 0,
          filter:
            "brightness(0) drop-shadow(0 0 1.5px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.22))",
        }}
      >
        <CompactDiskAudioLogo />
      </Box>
    </Box>
  </Box>
);

export default CdHub;
