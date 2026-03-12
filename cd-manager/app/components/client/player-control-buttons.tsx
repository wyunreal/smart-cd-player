"use client";

import { IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useCallback, useContext, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";
import {
  PowerSettingsNewIcon,
  SearchOutlinedIcon,
  KeyboardArrowDownIcon,
} from "@/app/icons";
import ResponsiveDialog from "./dialog/responsive-dialog";
import SearchSlotForm from "@/app/forms/search-slot";
import NowPlaying from "./now-playing";
import TransportButtons from "./transport-buttons";

const PlayerControlButtons = () => {
  const {
    selectedPlayer,
    irRemoteClients,
    playerContent,
    selectedPlayerSlots,
    setSelectedPlayerSlots,
    displayState,
  } = useContext(DataRepositoryContext);

  const isOff = displayState?.mode === "off";

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchOpen, setSearchOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

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
      <TransportButtons />
      <IconButton
        onClick={() => sendCommand(PlayerCommand.PowerSwitch)}
        disabled={!isCommandSupported(PlayerCommand.PowerSwitch)}
      >
        <PowerSettingsNewIcon />
      </IconButton>
      {isMobile && (
        <IconButton onClick={() => setNowPlayingOpen(true)}>
          <KeyboardArrowDownIcon />
        </IconButton>
      )}
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
      <ResponsiveDialog
        title="Now Playing"
        isOpen={nowPlayingOpen}
        onClose={() => setNowPlayingOpen(false)}
        headless
        adaptToContentInMobile
      >
        <NowPlaying displayState={displayState} />
      </ResponsiveDialog>
    </>
  );
};

export default PlayerControlButtons;
