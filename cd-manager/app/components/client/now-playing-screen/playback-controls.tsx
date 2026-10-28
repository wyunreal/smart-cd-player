"use client";

import {
  Box,
  IconButton,
  LinearProgress,
  Slider,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { DisplayMode } from "@/api/types";
import {
  PauseIcon,
  PlayArrowIcon,
  PowerSettingsNewIcon,
  SearchOutlinedIcon,
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
  onSearch: () => void;
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

const utilityButtonSx = {
  width: { xs: 28, sm: 36, lg: 40 },
  height: { xs: 28, sm: 36, lg: 40 },
  padding: { xs: 0.5, sm: 0.75, lg: 1 },
} as const;

const transportButtonSx = {
  width: { xs: 32, sm: 40, lg: 40 },
  height: { xs: 32, sm: 40, lg: 40 },
  padding: { xs: 0.5, sm: 0.75, lg: 1 },
} as const;

const PlaybackControls = ({
  track,
  mode,
  volume,
  muted,
  actions,
  capabilities,
  onSearch,
}: PlaybackControlsProps) => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const isPlaying = mode === "playing";
  const isPowered = mode !== "off";
  const isMuted = muted;
  const elapsedSeconds = track?.elapsedSeconds ?? null;
  const durationSeconds = track?.durationSeconds ?? null;
  const hasDuration = durationSeconds != null && durationSeconds > 0;
  const maxProgress =
    durationSeconds != null && durationSeconds > 0 ? durationSeconds : 1;
  const progressValue =
    durationSeconds != null && durationSeconds > 0 && elapsedSeconds != null
      ? Math.min(elapsedSeconds, durationSeconds)
      : 0;
  const elapsedLabel =
    elapsedSeconds != null ? formatTime(elapsedSeconds) : null;
  const durationLabel =
    durationSeconds != null && durationSeconds > 0
      ? formatTime(durationSeconds)
      : null;
  const showIndeterminate = !hasDuration && isPlaying;

  const handleSeek = (_event: Event, value: number | number[]) => {
    actions.onSeek(Array.isArray(value) ? value[0] : value);
  };

  return (
    <Box>
      <Box>
        {hasDuration ? (
          <Slider
            min={0}
            max={maxProgress}
            value={progressValue}
            onChange={handleSeek}
            disabled={!capabilities.canSeek}
            aria-label="Progreso del track"
            getAriaValueText={() =>
              `${formatTime(progressValue)} de ${durationLabel ?? "--:--"}`
            }
            valueLabelDisplay="off"
            sx={sliderSx(theme)}
          />
        ) : (
          <Box sx={{ py: 1.5 }}>
            <LinearProgress
              variant={showIndeterminate ? "indeterminate" : "determinate"}
              value={showIndeterminate ? undefined : 0}
              aria-label="Progreso del track"
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.divider,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  backgroundColor: accent,
                },
                "& .MuiLinearProgress-bar1Indeterminate": {
                  animationDuration: "20s",
                },
                "& .MuiLinearProgress-bar2Indeterminate": {
                  animationDuration: "20s",
                  animationDelay: "10.96s",
                },
              }}
            />
          </Box>
        )}
        {(elapsedLabel || durationLabel) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: durationLabel ? "space-between" : "flex-start",
              mt: 0.5,
            }}
          >
            {elapsedLabel && (
              <Typography variant="caption" color="text.secondary">
                {elapsedLabel}
              </Typography>
            )}
            {durationLabel && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: elapsedLabel ? 0 : "auto" }}
              >
                {durationLabel}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          columnGap: { xs: 0.5, sm: 1.5 },
          mt: { xs: 2, sm: 2.5 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: { xs: 0.25, sm: 0.75, lg: 1 },
            minWidth: 0,
          }}
        >
          <IconButton
            onClick={actions.onTogglePower}
            disabled={!capabilities.canTogglePower}
            aria-label={isPowered ? "Apagar" : "Encender"}
            sx={{
              ...iconColorSx(
                theme,
                isPowered ? accent : theme.palette.text.secondary,
              ),
              ...utilityButtonSx,
            }}
          >
            <PowerSettingsNewIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton
            onClick={onSearch}
            aria-label="Buscar"
            sx={{
              ...iconColorSx(theme, theme.palette.text.secondary),
              ...utilityButtonSx,
            }}
          >
            <SearchOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton
            onClick={actions.onPrevious}
            disabled={!capabilities.canGoPrevious}
            aria-label="Track anterior"
            sx={{
              ...iconColorSx(theme, theme.palette.text.primary),
              ...transportButtonSx,
            }}
          >
            <SkipPreviousIcon sx={{ fontSize: { xs: 22, sm: 26, lg: 30 } }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            onClick={actions.onTogglePlay}
            disabled={!capabilities.canTogglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            sx={{
              ...iconColorSx(theme, accent),
              position: "relative",
              width: { xs: 54, sm: 66 },
              height: { xs: 54, sm: 66 },
              border: `1.5px solid ${accent}`,
              backgroundColor: "transparent",
              boxShadow: `0 0 18px ${alpha(accent, 0.45)}`,
              "&:hover": {
                backgroundColor: alpha(accent, 0.1),
              },
              "&.Mui-disabled": {
                borderColor: alpha(accent, 0.4),
                boxShadow: "none",
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
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: { xs: 0.25, sm: 0.75, lg: 1 },
            minWidth: 0,
          }}
        >
          <IconButton
            onClick={actions.onNext}
            disabled={!capabilities.canGoNext}
            aria-label="Track siguiente"
            sx={{
              ...iconColorSx(theme, theme.palette.text.primary),
              ...transportButtonSx,
            }}
          >
            <SkipNextIcon sx={{ fontSize: { xs: 22, sm: 26, lg: 30 } }} />
          </IconButton>

          <IconButton
            onClick={actions.onToggleMute}
            disabled={!capabilities.canMute}
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
            sx={{
              ...iconColorSx(theme, theme.palette.text.secondary),
              ...utilityButtonSx,
            }}
          >
            {isMuted ? (
              <VolumeOffIcon sx={{ fontSize: 20 }} />
            ) : (
              <VolumeUpIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          <Box
            sx={{
              display: "flex",
              "& .MuiIconButton-root": {
                width: { xs: 28, sm: 36, lg: 40 },
                height: { xs: 28, sm: 36, lg: 40 },
                padding: { xs: 0.5, sm: 0.75, lg: 1 },
              },
            }}
          >
            <EqualizerButton
              iconFontSize={20}
              color={theme.palette.text.secondary}
              activeColor={accent}
            />
          </Box>

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
        </Box>
      </Box>
    </Box>
  );
};

export default PlaybackControls;
