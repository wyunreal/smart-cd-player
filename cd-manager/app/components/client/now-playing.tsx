"use client";

/* eslint-disable @next/next/no-img-element */
import {
  Box,
  Fade,
  LinearProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import TransportButtons from "./transport-buttons";

export type DisplayMode = "off" | "stopped" | "playing" | "paused";

export type DisplayState = {
  mode: DisplayMode;
  disc: number | null;
  track: number | null;
  minutes: number | null;
  seconds: number | null;
  timestamp: number;
};

type NowPlayingProps = {
  displayState?: DisplayState | null;
};

const formatTime = (minutes: number | null, seconds: number | null) => {
  if (minutes === null && seconds === null) return "--:--";
  const m = String(minutes ?? 0).padStart(2, "0");
  const s = String(seconds ?? 0).padStart(2, "0");
  return `${m}:${s}`;
};

const NowPlaying = ({ displayState }: NowPlayingProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [visible, setVisible] = useState(isMobile);

  const { selectedPlayer, playerContent } = useContext(DataRepositoryContext);

  const currentSlot = useMemo(() => {
    if (selectedPlayer === null || displayState?.disc === null) return null;
    const slots = playerContent[selectedPlayer - 1];
    return slots?.find((s) => s.slot === displayState?.disc) ?? null;
  }, [selectedPlayer, playerContent, displayState?.disc]);

  const cd = currentSlot?.cd;
  const albumArt = cd?.art?.album?.uri150 || "/cd-placeholder-small.png";
  const title =
    cd && (cd.diskAmount || 1) > 1
      ? `${cd.title}, Disc ${cd.diskNumber}`
      : cd?.title || "No disk";

  const currentTrack = useMemo(() => {
    if (!cd || displayState?.track == null) return null;
    return cd.tracks?.find((t) => t.number === displayState.track) ?? null;
  }, [cd, displayState?.track]);

  const isMockDisplay =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("mockDisplay");

  const trackDurationSeconds = useMemo(() => {
    if (!currentTrack?.duration) {
      return isMockDisplay ? 240 : null;
    }
    const parts = currentTrack.duration.split(":");
    if (parts.length !== 2) return null;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }, [currentTrack, isMockDisplay]);

  // Local time interpolation: sync from displayState, tick every second when playing
  const [localMinutes, setLocalMinutes] = useState<number | null>(null);
  const [localSeconds, setLocalSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync local time when displayState changes (polling update)
  useEffect(() => {
    setLocalMinutes(displayState?.minutes ?? null);
    setLocalSeconds(displayState?.seconds ?? null);
  }, [displayState?.minutes, displayState?.seconds, displayState?.timestamp]);

  // Tick every second when playing
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (displayState?.mode !== "playing") return;

    intervalRef.current = setInterval(() => {
      setLocalSeconds((prev) => {
        if (prev === null) return null;
        if (prev >= 59) {
          setLocalMinutes((m) => (m !== null ? m + 1 : null));
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [displayState?.mode, displayState?.timestamp]);

  const progressPercent = useMemo(() => {
    if (trackDurationSeconds == null || trackDurationSeconds === 0) return null;
    const elapsed = (localMinutes ?? 0) * 60 + (localSeconds ?? 0);
    return Math.min((elapsed / trackDurationSeconds) * 100, 100);
  }, [trackDurationSeconds, localMinutes, localSeconds]);

  useEffect(() => {
    if (isMobile) return;
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  if (!displayState || displayState.disc == null) return null;

  return (
    <Fade in={visible} timeout={isMobile ? 0 : 500}>
      <Box sx={{ py: 1, px: "16px" }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <img
            src={albumArt}
            alt={title}
            width="72"
            height="72"
            style={{ borderRadius: "6px", objectFit: "cover" }}
          />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minWidth: 0,
            }}
          >
            <Typography variant="body2" color="text.secondary" noWrap>
              {cd?.artist || "No artist"}
            </Typography>
            <Typography variant="subtitle1" noWrap>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {displayState.track != null &&
                (currentTrack?.title
                  ? `${displayState.track}. ${currentTrack.title}`
                  : `Track ${displayState.track}`)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <TransportButtons />
        </Box>
        {progressPercent != null && trackDurationSeconds != null && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {formatTime(localMinutes, localSeconds)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTime(
                  Math.floor(trackDurationSeconds / 60),
                  trackDurationSeconds % 60,
                )}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default NowPlaying;
