"use client";

import { Box, IconButton } from "@mui/material";
import { useCallback, useContext, useMemo } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";
import {
  SkipPreviousIcon,
  PlayArrowIcon,
  PauseIcon,
  SkipNextIcon,
} from "@/app/icons";

const TransportButtons = () => {
  const { selectedPlayer, irRemoteClients, displayState, playerContent } =
    useContext(DataRepositoryContext);

  const isPlaying = displayState?.mode === "playing";

  const totalTracks = useMemo(() => {
    if (selectedPlayer === null || displayState?.disc == null) return null;
    const slots = playerContent[selectedPlayer - 1];
    const slot = slots?.find((s) => s.slot === displayState.disc);
    return slot?.cd?.tracks?.length ?? null;
  }, [selectedPlayer, playerContent, displayState?.disc]);

  const currentTrack = displayState?.track ?? null;
  const isFirstTrack = currentTrack != null && currentTrack <= 1;
  const isLastTrack =
    currentTrack != null && totalTracks != null && currentTrack >= totalTracks;

  const currentRemoteClient =
    selectedPlayer !== null ? irRemoteClients[selectedPlayer - 1] : null;

  const sendCommand = useCallback(
    async (command: PlayerCommand) => {
      if (!currentRemoteClient) return;
      try {
        await currentRemoteClient.sendOrder([{ command, delayAfterMs: 0 }]);
      } catch (e) {
        console.error("Failed to send command", e);
      }
    },
    [currentRemoteClient],
  );

  const isCommandSupported = useCallback(
    (command: PlayerCommand) => {
      return currentRemoteClient?.isCommandSupported(command) ?? false;
    },
    [currentRemoteClient],
  );

  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.PreviousTrack)}
        disabled={!isCommandSupported(PlayerCommand.PreviousTrack) || isFirstTrack}

      >
        <SkipPreviousIcon />
      </IconButton>
      {isPlaying ? (
        <IconButton
          onClick={() => sendCommand(PlayerCommand.Pause)}
          disabled={!isCommandSupported(PlayerCommand.Pause)}
  
        >
          <PauseIcon />
        </IconButton>
      ) : (
        <IconButton
          onClick={() => sendCommand(PlayerCommand.Play)}
          disabled={!isCommandSupported(PlayerCommand.Play)}
  
        >
          <PlayArrowIcon />
        </IconButton>
      )}
      <IconButton
        onClick={() => sendCommand(PlayerCommand.NextTrack)}
        disabled={!isCommandSupported(PlayerCommand.NextTrack) || isLastTrack}

      >
        <SkipNextIcon />
      </IconButton>
    </Box>
  );
};

export default TransportButtons;
