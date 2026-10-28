"use client";

import { IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useCallback, useContext, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";
import { sendPowerToAllPlayers } from "@/api/player-remote/client";
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
    nowPlayingPlayer,
    nowPlayingStreamId,
    nowPlayingDisplayState,
    displayState,
  } = useContext(DataRepositoryContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchOpen, setSearchOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  // The players page controls the player currently selected in the page, not
  // whichever player happens to be playing elsewhere.
  const currentPlayerSlots =
    selectedPlayer !== null ? playerContent[selectedPlayer - 1] : [];

  // Power is a master switch: it is sent to every player that has an IR
  // client supporting the toggle, not only the selected one.
  const canTogglePower = irRemoteClients.some(
    (client) => client?.isCommandSupported(PlayerCommand.PowerSwitch) ?? false,
  );
  const handleTogglePower = useCallback(() => {
    void sendPowerToAllPlayers(irRemoteClients);
  }, [irRemoteClients]);

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
      <TransportButtons
        player={selectedPlayer}
        displayState={displayState}
      />
      <IconButton
        onClick={handleTogglePower}
        disabled={!canTogglePower}
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
        <NowPlaying
          player={nowPlayingPlayer}
          streamId={nowPlayingStreamId}
          displayState={nowPlayingDisplayState}
        />
      </ResponsiveDialog>
    </>
  );
};

export default PlayerControlButtons;
