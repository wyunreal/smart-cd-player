"use client";

import { Box, IconButton, Slider, Typography, useTheme } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { DisplayMode } from "@/api/types";
import {
  PauseIcon,
  PlayArrowIcon,
  SkipNextIcon,
  SkipPreviousIcon,
  VolumeOffIcon,
  VolumeUpIcon,
} from "@/app/icons";
import EqualizerButton from "@/app/components/client/equalizer-button";
import type {
  NowPlayingActions,
  NowPlayingCapabilities,
  NowPlayingTrackView,
} from "./types";

type PlaybackControlsProps = {
  track: NowPlayingTrackView | null;
  mode: DisplayMode;
  volume: number;
  muted: boolean;
  actions: NowPlayingActions;
  capabilities: NowPlayingCapabilities;
};

const formatTime = (totalSeconds: number) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const sliderSx = (theme: Theme, thumbSize = 14) => {
  const accent = theme.palette.primary.main;
  const accentSoft = alpha(accent, 0.16);
  const accentGlow = alpha(accent, 0.45);

  return {
    height: 4,
    padding: "12px 0",
    "& .MuiSlider-rail": {
      opacity: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.palette.divider,
    },
    "& .MuiSlider-track": {
      border: 0,
      height: 4,
      borderRadius: 2,
      backgroundColor: accent,
    },
    "& .MuiSlider-thumb": {
      width: thumbSize,
      height: thumbSize,
      backgroundColor: accent,
      boxShadow: `0 0 0 4px ${accentSoft}, 0 0 12px ${accentGlow}`,
      "&:hover, &.Mui-focusVisible": {
        boxShadow: `0 0 0 6px ${accentSoft}, 0 0 16px ${accentGlow}`,
      },
      "&.Mui-active": {
        boxShadow: `0 0 0 6px ${accentSoft}, 0 0 18px ${accentGlow}`,
      },
    },
    "& .MuiSlider-valueLabel": {
      display: "none",
    },
    "&.Mui-disabled": {
      opacity: 0.55,
    },
  };
};

const iconColorSx = (theme: Theme, color: string) => ({
  color,
  "&&&": { color },
  "&&&.Mui-disabled": { color: theme.palette.action.disabled },
});

const PlaybackControls = ({
  track,
  mode,
  volume,
  muted,
  actions,
  capabilities,
}: PlaybackControlsProps) => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const isPlaying = mode === "playing";
  const isMuted = muted;
  const elapsedSeconds = track?.elapsedSeconds ?? 0;
  const durationSeconds = track?.durationSeconds ?? 0;
  const hasDuration = durationSeconds > 0;
  const progressValue = hasDuration
    ? Math.min(elapsedSeconds, durationSeconds)
    : 0;

  const handleSeek = (_event: Event, value: number | number[]) => {
    actions.onSeek(Array.isArray(value) ? value[0] : value);
  };

  return (
    <Box>
      <Box>
        <Slider
          min={0}
          max={hasDuration ? durationSeconds : 1}
          value={progressValue}
          onChange={handleSeek}
          disabled={!capabilities.canSeek || !hasDuration}
          aria-label="Progreso del track"
          getAriaValueText={() =>
            hasDuration
              ? `${formatTime(progressValue)} de ${formatTime(durationSeconds)}`
              : "Duración desconocida"
          }
          valueLabelDisplay="off"
          sx={sliderSx(theme)}
        />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {hasDuration ? formatTime(progressValue) : "--:--"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hasDuration ? formatTime(durationSeconds) : "--:--"}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr auto 1fr" },
          alignItems: "center",
          gap: { xs: 2, sm: 2.5 },
          mt: { xs: 2, sm: 2.5 },
        }}
      >
        <Box sx={{ display: { xs: "none", lg: "block" } }} />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 0.5, sm: 1.5 },
          }}
        >
          <IconButton
            onClick={actions.onPrevious}
            disabled={!capabilities.canGoPrevious}
            aria-label="Track anterior"
            sx={iconColorSx(theme, theme.palette.text.primary)}
          >
            <SkipPreviousIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
          </IconButton>

          <IconButton
            onClick={actions.onTogglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            sx={{
              ...iconColorSx(theme, accent),
              position: "relative",
              width: { xs: 58, sm: 66 },
              height: { xs: 58, sm: 66 },
              border: `1.5px solid ${accent}`,
              backgroundColor: "transparent",
              boxShadow: `0 0 18px ${alpha(accent, 0.45)}`,
              "&:hover": {
                backgroundColor: alpha(accent, 0.1),
              },
              "&::before": {
                content: '""',
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: `1px solid ${alpha(accent, 0.16)}`,
                pointerEvents: "none",
              },
            }}
          >
            {isPlaying ? (
              <PauseIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
            ) : (
              <PlayArrowIcon sx={{ fontSize: { xs: 32, sm: 36 }, ml: "3px" }} />
            )}
          </IconButton>

          <IconButton
            onClick={actions.onNext}
            disabled={!capabilities.canGoNext}
            aria-label="Track siguiente"
            sx={iconColorSx(theme, theme.palette.text.primary)}
          >
            <SkipNextIcon sx={{ fontSize: { xs: 26, sm: 30 } }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", lg: "flex-end" },
            gap: 1,
            minWidth: { lg: 210 },
          }}
        >
          <Slider
            min={0}
            max={100}
            value={volume}
            onChange={(_event, value) =>
              actions.onVolumeChange(Array.isArray(value) ? value[0] : value)
            }
            disabled={!capabilities.canControlVolume || isMuted}
            aria-label="Volumen"
            getAriaValueText={(value) => `${value}%`}
            valueLabelDisplay="off"
            sx={{
              ...sliderSx(theme, 10),
              display: { xs: "none", sm: "none", lg: "inline-block" },
              width: { lg: 120, xl: 150 },
              // Keep the slider space while muted so the buttons on its
              // right do not jump when toggling mute.
              visibility: isMuted ? "hidden" : "visible",
            }}
          />

          <IconButton
            onClick={actions.onToggleMute}
            disabled={!capabilities.canMute || !capabilities.canControlVolume}
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            sx={iconColorSx(theme, theme.palette.text.secondary)}
          >
            {isMuted ? (
              <VolumeOffIcon sx={{ fontSize: 20 }} />
            ) : (
              <VolumeUpIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          <EqualizerButton
            iconFontSize={20}
            color={theme.palette.text.secondary}
            activeColor={accent}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PlaybackControls;
