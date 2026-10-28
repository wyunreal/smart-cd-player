"use client";

import { IconButton } from "@mui/material";
import { useState } from "react";
import useAudioStream from "@/app/hooks/use-audio-stream";
import { EqualizerIcon } from "@/app/icons";
import EqualizerDialog from "./equalizer-dialog";

type EqualizerButtonProps = {
  iconFontSize?: number;
  color?: string;
  activeColor?: string;
};

/**
 * Equalizer button shared by the transport buttons and the big Now Playing
 * view. It owns the dialog state so both presentations behave the same way.
 */
const EqualizerButton = ({
  iconFontSize = 24,
  color,
  activeColor = "primary.main",
}: EqualizerButtonProps) => {
  const { ready, eqEnabled } = useAudioStream();
  const [dialogOpen, setDialogOpen] = useState(false);

  const resolvedColor = eqEnabled ? activeColor : color;

  return (
    <>
      <IconButton
        onClick={() => setDialogOpen(true)}
        disabled={!ready}
        aria-label="Equalizer"
        sx={
          resolvedColor
            ? {
                color: resolvedColor,
                "&&&": { color: resolvedColor },
              }
            : undefined
        }
      >
        <EqualizerIcon sx={{ fontSize: iconFontSize }} />
      </IconButton>
      <EqualizerDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default EqualizerButton;
