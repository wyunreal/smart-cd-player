"use client";

import { IconButton } from "@mui/material";
import { useCallback, useContext } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";
import {
  SkipPreviousIcon,
  PlayArrowIcon,
  PauseIcon,
  SkipNextIcon,
  PowerSettingsNewIcon,
} from "@/app/icons";

const PlayerControlButtons = () => {
  const { selectedPlayer, irRemoteClients } = useContext(DataRepositoryContext);

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
    <>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.PreviousTrack)}
        disabled={!isCommandSupported(PlayerCommand.PreviousTrack)}
      >
        <SkipPreviousIcon />
      </IconButton>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.Play)}
        disabled={!isCommandSupported(PlayerCommand.Play)}
      >
        <PlayArrowIcon />
      </IconButton>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.Pause)}
        disabled={!isCommandSupported(PlayerCommand.Pause)}
      >
        <PauseIcon />
      </IconButton>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.NextTrack)}
        disabled={!isCommandSupported(PlayerCommand.NextTrack)}
      >
        <SkipNextIcon />
      </IconButton>
      <IconButton
        onClick={() => sendCommand(PlayerCommand.PowerSwitch)}
        disabled={!isCommandSupported(PlayerCommand.PowerSwitch)}
      >
        <PowerSettingsNewIcon />
      </IconButton>
    </>
  );
};

export default PlayerControlButtons;
