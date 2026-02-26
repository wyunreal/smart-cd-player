"use client";

import { IconButton } from "@mui/material";
import { useCallback, useContext, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";
import {
  SkipPreviousIcon,
  PlayArrowIcon,
  PauseIcon,
  SkipNextIcon,
  PowerSettingsNewIcon,
  SearchOutlinedIcon,
} from "@/app/icons";
import ResponsiveDialog from "./dialog/responsive-dialog";
import SearchSlotForm from "@/app/forms/search-slot";

const PlayerControlButtons = () => {
  const {
    selectedPlayer,
    irRemoteClients,
    playerContent,
    selectedPlayerSlots,
    setSelectedPlayerSlots,
  } = useContext(DataRepositoryContext);

  const [searchOpen, setSearchOpen] = useState(false);

  const currentRemoteClient =
    selectedPlayer !== null ? irRemoteClients[selectedPlayer - 1] : null;

  const currentPlayerSlots =
    selectedPlayer !== null ? playerContent[selectedPlayer - 1] : [];

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

  const handleSlotSelect = useCallback(
    (slotIndex: number) => {
      if (selectedPlayer === null) return;
      const playerIndex = selectedPlayer - 1;
      const newSlots = [...selectedPlayerSlots];
      newSlots[playerIndex] = slotIndex;
      setSelectedPlayerSlots(newSlots);
      setSearchOpen(false);
    },
    [selectedPlayer, selectedPlayerSlots, setSelectedPlayerSlots],
  );

  return (
    <>
      <IconButton
        onClick={() => setSearchOpen(true)}
        disabled={selectedPlayer === null}
      >
        <SearchOutlinedIcon />
      </IconButton>
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
      <ResponsiveDialog
        title="Search"
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        noPadding
      >
        <SearchSlotForm
          slots={currentPlayerSlots}
          onSlotSelect={handleSlotSelect}
          isOpen={searchOpen}
        />
      </ResponsiveDialog>
    </>
  );
};

export default PlayerControlButtons;
