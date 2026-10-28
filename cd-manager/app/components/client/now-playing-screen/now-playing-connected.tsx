"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PlayerCommand, type DisplayState } from "@/api/types";
import { getPlayTrackOrder } from "@/api/player-remote/command-factory";
import {
  sendPowerToAllPlayers,
  type IrCommandSequenceItem,
} from "@/api/player-remote/client";
import { DataRepositoryContext, type PlayerSlot } from "@/app/providers/data-repository";
import useAudioStream from "@/app/hooks/use-audio-stream";
import { getPlayerStreamId } from "@/lib/display";
import {
  getTrackForDisc,
  getTracksForDisc,
  parseTrackDuration,
} from "@/lib/tracks";
import NowPlayingView from "./now-playing-view";
import type {
  NowPlayingActions,
  NowPlayingCapabilities,
  NowPlayingViewData,
} from "./types";

const PLACEHOLDER_ALBUM: NowPlayingViewData["album"] = {
  title: "No disc",
  artist: "",
  year: null,
  genre: null,
  totalTracks: 0,
  coverArt: "/cd-placeholder-big.png",
  discArt: "/cd-placeholder-big.png",
};

const buildErrorMessage = (
  displayState: DisplayState | null,
  player: number | null,
  streamId: string | null,
) => {
  if (!displayState || displayState.status !== "error") return null;

  const error = displayState.error ?? "Could not read the player display.";
  const sentence = /[.!?]$/.test(error) ? error : `${error}.`;
  const playerLabel =
    player !== null
      ? `Player ${player}${streamId ? ` (stream "${streamId}")` : ""}: `
      : "";
  const hint = /composite-video-parser/i.test(error)
    ? ""
    : " Check the configured stream ID and the capture status in composite-video-parser (GET /streams).";

  return `${playerLabel}${sentence}${hint}`;
};

/**
 * Connected "Now Playing" screen. Reads the same repository, display polling,
 * remote client and audio stream state as the small sidebar card and maps them
 * onto the presentational view.
 */
const NowPlayingConnected = () => {
  const {
    commandPlayer,
    commandDisplayState,
    displayLoaded,
    playerContent,
    playerDefinitions,
    irRemoteClients,
  } = useContext(DataRepositoryContext);
  const {
    muted,
    toggleMute,
    ready: audioReady,
    volume,
    setVolume,
  } = useAudioStream();

  const displayState = commandDisplayState;
  const playerIndex = commandPlayer;

  const playerDefinition = useMemo(
    () =>
      (playerDefinitions ?? []).find(
        (definition) => definition.remoteIndex === playerIndex,
      ) ?? null,
    [playerDefinitions, playerIndex],
  );
  const streamId = getPlayerStreamId(playerDefinition);

  const currentSlot = useMemo(() => {
    if (playerIndex === null || displayState?.disc == null) return null;

    const slots = playerContent[playerIndex - 1];
    return (
      slots?.find((slot: PlayerSlot) => slot.slot === displayState.disc) ?? null
    );
  }, [playerIndex, playerContent, displayState?.disc]);

  const cd = currentSlot?.cd ?? null;

  const discTracks = useMemo(() => getTracksForDisc(cd), [cd]);
  const currentTrack = useMemo(
    () => getTrackForDisc(cd, displayState?.track),
    [cd, displayState?.track],
  );
  const durationSeconds = parseTrackDuration(currentTrack?.duration);

  // Keep the elapsed time smooth between /display polls, like the sidebar card.
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (displayState?.minutes == null && displayState?.seconds == null) {
      setElapsedSeconds(null);
      return;
    }

    setElapsedSeconds(
      (displayState.minutes ?? 0) * 60 + (displayState.seconds ?? 0),
    );
  }, [
    displayState?.minutes,
    displayState?.seconds,
    displayState?.timestamp,
  ]);

  useEffect(() => {
    if (displayState?.mode !== "playing") return;

    const timer = setInterval(() => {
      setElapsedSeconds((previous) => {
        if (previous === null) return previous;
        if (durationSeconds != null && previous >= durationSeconds) {
          return durationSeconds;
        }
        return previous + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [displayState?.mode, displayState?.timestamp, durationSeconds]);

  const currentRemoteClient =
    playerIndex !== null ? irRemoteClients[playerIndex - 1] ?? null : null;

  const sendSequence = useCallback(
    async (sequence: IrCommandSequenceItem[]) => {
      if (!currentRemoteClient) return;
      try {
        await currentRemoteClient.sendOrder(sequence);
      } catch (error) {
        console.error("Failed to send command", error);
      }
    },
    [currentRemoteClient],
  );

  const sendCommand = useCallback(
    (command: PlayerCommand) => {
      if (!currentRemoteClient?.isCommandSupported(command)) return;
      void sendSequence([{ command, delayAfterMs: 0 }]);
    },
    [currentRemoteClient, sendSequence],
  );

  const isPlaying = displayState?.mode === "playing";
  const isOff = displayState == null || displayState.mode === "off";
  const displayedTrack = displayState?.track ?? null;
  const totalTracks = discTracks.length;
  const isFirstTrack = displayedTrack != null && displayedTrack <= 1;
  const isLastTrack =
    displayedTrack != null && totalTracks > 0 && displayedTrack >= totalTracks;

  const isCommandSupported = useCallback(
    (command: PlayerCommand) =>
      currentRemoteClient?.isCommandSupported(command) ?? false,
    [currentRemoteClient],
  );

  const canTogglePlay =
    !isOff &&
    (isPlaying
      ? isCommandSupported(PlayerCommand.Pause)
      : isCommandSupported(PlayerCommand.Play));
  const canTogglePower = irRemoteClients.some(
    (client) => client?.isCommandSupported(PlayerCommand.PowerSwitch) ?? false,
  );
  const canGoPrevious =
    !isOff &&
    isCommandSupported(PlayerCommand.PreviousTrack) &&
    !isFirstTrack;
  const canGoNext =
    !isOff && isCommandSupported(PlayerCommand.NextTrack) && !isLastTrack;

  const handleTogglePlay = useCallback(() => {
    if (isOff) return;
    sendCommand(isPlaying ? PlayerCommand.Pause : PlayerCommand.Play);
  }, [isOff, isPlaying, sendCommand]);

  const handlePrevious = useCallback(() => {
    if (isOff) return;
    sendCommand(PlayerCommand.PreviousTrack);
  }, [isOff, sendCommand]);

  const handleNext = useCallback(() => {
    if (isOff) return;
    sendCommand(PlayerCommand.NextTrack);
  }, [isOff, sendCommand]);

  const handleTogglePower = useCallback(() => {
    void sendPowerToAllPlayers(irRemoteClients);
  }, [irRemoteClients]);

  const handleSelectTrack = useCallback(
    (index: number) => {
      if (!currentRemoteClient || index < 0 || index >= discTracks.length) {
        return;
      }

      // The player expects the position within the disc, not the continuous
      // Discogs track number of multi-disc releases.
      const sequence = getPlayTrackOrder(index + 1);
      if (!currentRemoteClient.canExecuteSequence(sequence)) return;

      void sendSequence(sequence);
    },
    [currentRemoteClient, discTracks.length, sendSequence],
  );

  const albumArt =
    cd?.art?.album?.uri ||
    cd?.art?.album?.uri150 ||
    "/cd-placeholder-big.png";
  const discArt =
    cd?.art?.cd?.uri || cd?.art?.cd?.uri150 || albumArt;

  const data: NowPlayingViewData = {
    hasDisc: cd != null,
    album: cd
      ? {
          title:
            (cd.diskAmount ?? 1) > 1 && cd.diskNumber != null
              ? `${cd.title}, Disc ${cd.diskNumber}`
              : cd.title,
          artist: cd.artist,
          year: cd.year != null && cd.year > 0 ? cd.year : null,
          genre: cd.genre || null,
          totalTracks,
          coverArt: albumArt,
          discArt,
        }
      : PLACEHOLDER_ALBUM,
    track:
      displayedTrack != null && displayedTrack > 0
        ? {
            number: displayedTrack,
            title: currentTrack?.title ?? `Track ${displayedTrack}`,
            artist: cd?.artist ?? "",
            elapsedSeconds,
            durationSeconds,
          }
        : null,
    tracks: discTracks.map((track, index) => ({
      number: index + 1,
      title: track.title,
    })),
    mode: displayState?.mode ?? "off",
    volume,
    muted,
  };

  const actions: NowPlayingActions = {
    onTogglePlay: handleTogglePlay,
    onPrevious: handlePrevious,
    onNext: handleNext,
    // Exact seeking is not supported by the IR remote.
    onSeek: () => {},
    onVolumeChange: setVolume,
    onToggleMute: toggleMute,
    onSelectTrack: handleSelectTrack,
    onTogglePower: handleTogglePower,
  };

  const capabilities: NowPlayingCapabilities = {
    canTogglePlay,
    canTogglePower,
    canGoPrevious,
    canGoNext,
    canSeek: false,
    canControlVolume: audioReady,
    canMute: audioReady,
  };

  if (!displayLoaded) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const message = buildErrorMessage(displayState, playerIndex, streamId);
  if (message) {
    return (
      <Box sx={{ py: 2, px: { xs: 2.5, sm: 4, lg: 4 } }}>
        <Alert severity="error" variant="outlined">
          {message}
        </Alert>
      </Box>
    );
  }

  return (
    <NowPlayingView
      data={data}
      actions={actions}
      capabilities={capabilities}
    />
  );
};

export default NowPlayingConnected;
