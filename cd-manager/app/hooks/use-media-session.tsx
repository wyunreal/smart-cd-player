"use client";

import { useContext, useEffect, useMemo, useRef } from "react";
import { DataRepositoryContext, type PlayerSlot } from "@/app/providers/data-repository";
import {
  AudioStreamContext,
} from "@/app/providers/audio-stream-provider";
import { PlayerCommand } from "@/api/types";

const isMediaSessionSupported =
  typeof navigator !== "undefined" && "mediaSession" in navigator;

const parseTrackDuration = (duration?: string): number | null => {
  if (!duration) return null;
  const parts = duration.split(":");
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const useMediaSession = () => {
  const {
    selectedPlayer,
    playerContent,
    displayState,
    irRemoteClients,
  } = useContext(DataRepositoryContext);
  const { audioContext } = useContext(AudioStreamContext);

  const currentRemoteClient =
    selectedPlayer !== null ? irRemoteClients[selectedPlayer - 1] ?? null : null;

  const currentSlot = useMemo(() => {
    if (selectedPlayer === null || displayState?.disc == null) return null;
    const slots = playerContent[selectedPlayer - 1];
    return slots?.find((s: PlayerSlot) => s.slot === displayState.disc) ?? null;
  }, [selectedPlayer, playerContent, displayState?.disc]);

  const cd = currentSlot?.cd ?? null;

  const currentTrack = useMemo(() => {
    if (!cd || displayState?.track == null) return null;
    return cd.tracks?.find((t) => t.number === displayState.track) ?? null;
  }, [cd, displayState?.track]);

  const trackDurationSeconds = useMemo(
    () => parseTrackDuration(currentTrack?.duration),
    [currentTrack?.duration],
  );

  const totalTracks = useMemo(() => {
    if (selectedPlayer === null || displayState?.disc == null) return null;
    const slots = playerContent[selectedPlayer - 1];
    const slot = slots?.find((s: PlayerSlot) => s.slot === displayState.disc);
    return slot?.cd?.tracks?.length ?? null;
  }, [selectedPlayer, playerContent, displayState?.disc]);

  const isFirstTrack = (displayState?.track ?? null) != null && (displayState?.track ?? 0) <= 1;
  const isLastTrack =
    (displayState?.track ?? null) != null &&
    totalTracks != null &&
    (displayState?.track ?? 0) >= totalTracks;

  // iOS Safari requires an active <audio> element for lock screen transport
  // controls to fire action handlers. We create a silent MediaStream from the
  // existing AudioContext (an inaudible oscillator) and feed it to an <audio>
  // element. This gives iOS a "real" media element without affecting audible output.
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    if (!isMediaSessionSupported || !audioContext) return;

    const dest = audioContext.createMediaStreamDestination();
    mediaStreamDestRef.current = dest;

    // Inaudible oscillator to keep the stream alive
    const osc = audioContext.createOscillator();
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    osc.connect(silentGain);
    silentGain.connect(dest);
    osc.start();

    const audio = new Audio();
    audio.srcObject = dest.stream;
    audio.loop = true;
    silentAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.srcObject = null;
      osc.stop();
      osc.disconnect();
      silentGain.disconnect();
      dest.disconnect();
      silentAudioRef.current = null;
      mediaStreamDestRef.current = null;
    };
  }, [audioContext]);

  // Unlock the silent audio element on the first user interaction.
  // This satisfies the iOS user-gesture requirement for audio.play().
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (!isMediaSessionSupported) return;

    const unlock = () => {
      const audio = silentAudioRef.current;
      if (!audio || unlockedRef.current) return;
      const dest = mediaStreamDestRef.current;
      if (!audio.srcObject && dest) {
        audio.srcObject = dest.stream;
      }
      audio.play().then(() => {
        unlockedRef.current = true;
        document.removeEventListener("click", unlock);
      }).catch(() => {});
    };

    document.addEventListener("click", unlock);
    return () => document.removeEventListener("click", unlock);
  }, [audioContext]);

  // Manage the silent audio element in sync with the CD player state.
  // When playing/paused: keep it active so the lock screen widget stays visible.
  // When off/stopped: remove srcObject so iOS releases the audio session and
  // suspends the AudioContext, stopping any residual audio from the stream.
  useEffect(() => {
    if (!isMediaSessionSupported) return;
    const audio = silentAudioRef.current;
    const dest = mediaStreamDestRef.current;
    if (!audio) return;

    const mode = displayState?.mode;
    if (mode === "playing" || mode === "paused") {
      if (!audio.srcObject && dest) {
        audio.srcObject = dest.stream;
      }
      if (audio.paused && unlockedRef.current) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
      audio.srcObject = null;
    }
  }, [displayState?.mode]);

  // Effect 1: Metadata
  useEffect(() => {
    if (!isMediaSessionSupported) return;

    if (!cd || !displayState || displayState.disc == null) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artwork: MediaImage[] = [];
    if (cd.art?.album) {
      if (cd.art.album.uri150) {
        artwork.push({ src: cd.art.album.uri150, sizes: "150x150", type: "image/jpeg" });
      }
      if (cd.art.album.uri) {
        const w = cd.art.album.width || 600;
        const h = cd.art.album.height || 600;
        artwork.push({ src: cd.art.album.uri, sizes: `${w}x${h}`, type: "image/jpeg" });
      }
    }

    const albumTitle =
      cd.diskAmount && cd.diskAmount > 1
        ? `${cd.title}, Disc ${cd.diskNumber}`
        : cd.title;

    const trackTitle = currentTrack?.title
      ? `${displayState.track}. ${currentTrack.title}`
      : displayState.track != null
        ? `Track ${displayState.track}`
        : albumTitle;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: trackTitle,
      artist: cd.artist,
      album: albumTitle,
      artwork,
    });
  }, [cd, currentTrack, displayState]);

  // Effect 2: Playback state
  useEffect(() => {
    if (!isMediaSessionSupported) return;

    const mode = displayState?.mode;
    if (mode === "playing") {
      navigator.mediaSession.playbackState = "playing";
    } else if (mode === "paused") {
      navigator.mediaSession.playbackState = "paused";
    } else {
      navigator.mediaSession.playbackState = "none";
    }
  }, [displayState?.mode]);

  // Effect 3: Position state
  useEffect(() => {
    if (!isMediaSessionSupported) return;

    if (
      trackDurationSeconds == null ||
      trackDurationSeconds <= 0 ||
      displayState?.minutes == null ||
      displayState?.seconds == null
    ) {
      try {
        navigator.mediaSession.setPositionState();
      } catch { /* ignore browsers that don't support clearing */ }
      return;
    }

    const position = Math.min(
      (displayState.minutes ?? 0) * 60 + (displayState.seconds ?? 0),
      trackDurationSeconds,
    );

    try {
      navigator.mediaSession.setPositionState({
        duration: trackDurationSeconds,
        playbackRate: 1,
        position,
      });
    } catch { /* ignore invalid state errors */ }
  }, [displayState?.minutes, displayState?.seconds, displayState?.timestamp, trackDurationSeconds]);

  // Effect 4: Action handlers
  useEffect(() => {
    if (!isMediaSessionSupported) return;

    const isOff = !displayState || displayState.mode === "off";
    const canSend = currentRemoteClient && !isOff;

    const sendCommand = async (command: PlayerCommand) => {
      if (!currentRemoteClient) return;
      try {
        await currentRemoteClient.sendOrder([{ command, delayAfterMs: 0 }]);
      } catch (e) {
        console.error("Media session: failed to send command", e);
      }
    };

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch { /* unsupported action */ }
    };

    setHandler(
      "play",
      canSend && currentRemoteClient.isCommandSupported(PlayerCommand.Play)
        ? () => sendCommand(PlayerCommand.Play)
        : null,
    );

    setHandler(
      "pause",
      canSend && currentRemoteClient.isCommandSupported(PlayerCommand.Pause)
        ? () => sendCommand(PlayerCommand.Pause)
        : null,
    );

    setHandler(
      "stop",
      canSend && currentRemoteClient.isCommandSupported(PlayerCommand.Stop)
        ? () => sendCommand(PlayerCommand.Stop)
        : null,
    );

    setHandler(
      "previoustrack",
      canSend &&
        currentRemoteClient.isCommandSupported(PlayerCommand.PreviousTrack) &&
        !isFirstTrack
        ? () => sendCommand(PlayerCommand.PreviousTrack)
        : null,
    );

    setHandler(
      "nexttrack",
      canSend &&
        currentRemoteClient.isCommandSupported(PlayerCommand.NextTrack) &&
        !isLastTrack
        ? () => sendCommand(PlayerCommand.NextTrack)
        : null,
    );

    // Explicitly disable seek actions (not possible via IR remote)
    setHandler("seekto", null);
    setHandler("seekforward", null);
    setHandler("seekbackward", null);

    return () => {
      setHandler("play", null);
      setHandler("pause", null);
      setHandler("stop", null);
      setHandler("previoustrack", null);
      setHandler("nexttrack", null);
      setHandler("seekto", null);
      setHandler("seekforward", null);
      setHandler("seekbackward", null);
    };
  }, [currentRemoteClient, displayState, isFirstTrack, isLastTrack]);
};

export default useMediaSession;
