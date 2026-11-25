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
    focusedPlayer,
    irRemoteClients,
    visibleSlots,
    setSelectedVirtualNumber,
    nowPlayingPlayer,
    nowPlayingStreamId,
    nowPlayingDisplayState,
    displayState,
  } = useContext(DataRepositoryContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchOpen, setSearchOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);

  // Power is a master switch: it is sent to every player that has an IR
  // client supporting the toggle, not only the focused one.
  const canTogglePower = irRemoteClients.some(
    (client) => client?.isCommandSupported(PlayerCommand.PowerSwitch) ?? false,
  );
  const handleTogglePower = useCallback(() => {
    void sendPowerToAllPlayers(irRemoteClients);
  }, [irRemoteClients]);

  const handleSlotSelect = useCallback(
    (virtualNumber: number) => {
      setSelectedVirtualNumber(virtualNumber);
      setSearchOpen(false);
    },
    [setSelectedVirtualNumber],
  );

  return (
    <>
      <IconButton
        onClick={() => setSearchOpen(true)}
        disabled={visibleSlots.length === 0}
      >
        <SearchOutlinedIcon />
      </IconButton>
      <TransportButtons
        player={focusedPlayer}
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
          slots={visibleSlots}
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
