"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DisplayMode } from "@/api/types";
import {
  MOCK_ALBUM,
  MOCK_INITIAL_ELAPSED_SECONDS,
  MOCK_INITIAL_TRACK_INDEX,
  MOCK_INITIAL_VOLUME,
  MOCK_TRACKS,
} from "./mock-now-playing";
import type { NowPlayingViewProps } from "./types";

const LAST_TRACK_INDEX = MOCK_TRACKS.length - 1;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Disposable playback logic for the visual iteration. It is replaced by a
 * connected container once the UI is approved.
 */
export const useMockPlayback = (): NowPlayingViewProps => {
  const [mode, setMode] = useState<DisplayMode>("playing");
  const [trackIndex, setTrackIndex] = useState(MOCK_INITIAL_TRACK_INDEX);
  const [elapsedSeconds, setElapsedSeconds] = useState(
    MOCK_INITIAL_ELAPSED_SECONDS,
  );
  const [volume, setVolume] = useState(MOCK_INITIAL_VOLUME);
  const [muted, setMuted] = useState(false);

  const lastVolumeRef = useRef(MOCK_INITIAL_VOLUME);

  const currentTrack = MOCK_TRACKS[trackIndex];
  const durationSeconds = currentTrack.durationSeconds;

  // Advance the clock only while playing. A paused CD keeps spinning, but the
  // track position does not move.
  useEffect(() => {
    if (mode !== "playing") return;

    const timer = setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  // Move to the next track when the current one ends.
  useEffect(() => {
    if (mode !== "playing" || elapsedSeconds < durationSeconds) return;

    if (trackIndex < LAST_TRACK_INDEX) {
      setTrackIndex((index) => index + 1);
      setElapsedSeconds(0);
      return;
    }

    setMode("paused");
    setElapsedSeconds(durationSeconds);
  }, [durationSeconds, elapsedSeconds, mode, trackIndex]);

  const handleTogglePlay = useCallback(() => {
    if (mode === "playing") {
      setMode("paused");
      return;
    }

    if (elapsedSeconds >= durationSeconds) {
      setElapsedSeconds(0);
    }
    setMode("playing");
  }, [durationSeconds, elapsedSeconds, mode]);

  const handleNext = useCallback(() => {
    if (trackIndex < LAST_TRACK_INDEX) {
      setTrackIndex((index) => index + 1);
      setElapsedSeconds(0);
    }
  }, [trackIndex]);

  const handlePrevious = useCallback(() => {
    if (elapsedSeconds > 3 || trackIndex === 0) {
      setElapsedSeconds(0);
      return;
    }

    setTrackIndex((index) => index - 1);
    setElapsedSeconds(0);
  }, [elapsedSeconds, trackIndex]);

  const handleSeek = useCallback(
    (seconds: number) => {
      setElapsedSeconds(clamp(seconds, 0, durationSeconds));
    },
    [durationSeconds],
  );

  const handleVolumeChange = useCallback((nextVolume: number) => {
    const value = clamp(Math.round(nextVolume), 0, 100);
    setVolume(value);
    if (value > 0) {
      lastVolumeRef.current = value;
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (muted) {
      setMuted(false);
      setVolume(lastVolumeRef.current || MOCK_INITIAL_VOLUME);
      return;
    }

    lastVolumeRef.current = volume || MOCK_INITIAL_VOLUME;
    setMuted(true);
  }, [muted, volume]);

  return {
    data: {
      album: {
        title: MOCK_ALBUM.title,
        artist: MOCK_ALBUM.artist,
        year: MOCK_ALBUM.year,
        genre: MOCK_ALBUM.genre,
        totalTracks: MOCK_TRACKS.length,
        coverArt: MOCK_ALBUM.coverArt,
        discArt: MOCK_ALBUM.discArt,
      },
      track: {
        number: currentTrack.number,
        title: currentTrack.title,
        artist: MOCK_ALBUM.artist,
        elapsedSeconds,
        durationSeconds,
      },
      mode,
      volume,
      muted,
    },
    actions: {
      onTogglePlay: handleTogglePlay,
      onPrevious: handlePrevious,
      onNext: handleNext,
      onSeek: handleSeek,
      onVolumeChange: handleVolumeChange,
      onToggleMute: handleToggleMute,
    },
    capabilities: {
      canGoPrevious: trackIndex > 0 || elapsedSeconds > 3,
      canGoNext: trackIndex < LAST_TRACK_INDEX,
      canSeek: true,
      canControlVolume: true,
      canMute: true,
    },
  };
};
