"use client";

/* eslint-disable @next/next/no-img-element */
import { Box, Divider, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AlbumIcon } from "@/app/icons";
import CdDisc from "./cd-disc";
import PlaybackControls from "./playback-controls";
import type {
  NowPlayingAlbumView,
  NowPlayingTrackView,
  NowPlayingViewProps,
} from "./types";

const overlineSx = {
  display: "block",
  fontSize: 11,
  lineHeight: 1.4,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "text.secondary",
} as const;

const albumTitleSx = {
  mt: 0.5,
  fontSize: { xs: 24, sm: 28, lg: 30, xl: 36 },
  fontWeight: 500,
  lineHeight: 1.12,
  letterSpacing: "-0.01em",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
} as const;

const trackTitleSx = {
  mt: 0.5,
  fontSize: { xs: 20, sm: 24, lg: 24, xl: 28 },
  fontWeight: 500,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
} as const;

const DISC_SIZE = {
  xs: "min(68vw, 320px)",
  sm: "min(70vw, 620px)",
  lg: "min(30vw, 380px)",
  xl: "min(34vw, 500px)",
} as const;

/**
 * In the stacked/vertical layout only, pull the whole composition up by 30%
 * of the disc height so the top disappears under the app/title bar.
 */
const VERTICAL_LIFT = {
  xs: `calc(${DISC_SIZE.xs} * -0.3)`,
  sm: `calc(${DISC_SIZE.sm} * -0.3)`,
  lg: 0,
} as const;

type AlbumPanelProps = {
  album: NowPlayingAlbumView;
  track: NowPlayingTrackView | null;
};

const AlbumPanel = ({ album, track }: AlbumPanelProps) => {
  const theme = useTheme();

  const meta = [
    album.year != null ? String(album.year) : null,
    album.genre,
    album.totalTracks > 0
      ? `${album.totalTracks} ${album.totalTracks === 1 ? "track" : "tracks"}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "72px minmax(0, 1fr)",
          sm: "96px minmax(0, 1fr)",
          lg: "240px minmax(0, 1fr)",
          xl: "300px minmax(0, 1fr)",
        },
        columnGap: { xs: 2, sm: 3, lg: 3, xl: 4 },
        rowGap: { xs: 1.5, lg: 0 },
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          gridColumn: "1",
          gridRow: { xs: "1", lg: "1 / span 3" },
          alignSelf: "start",
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          overflow: "hidden",
          borderRadius: { xs: "6px", lg: "8px" },
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.action.hover,
          boxShadow: theme.shadows[2],
        }}
      >
        <img
          src={album.coverArt || "/cd-placeholder-big.png"}
          alt={`Portada de ${album.title} de ${album.artist}`}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      <Box
        sx={{
          gridColumn: "2",
          gridRow: "1",
          minWidth: 0,
        }}
      >
        <Typography variant="overline" sx={overlineSx}>
          Álbum
        </Typography>
        <Typography component="h2" sx={albumTitleSx}>
          {album.title}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: { xs: 16, sm: 18, lg: 20, xl: 22 },
            color: "text.secondary",
          }}
        >
          {album.artist}
        </Typography>
        {meta.length > 0 && (
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: "text.secondary",
              fontSize: { xs: 12, sm: 13, xl: 14 },
            }}
          >
            {meta.join(" · ")}
          </Typography>
        )}
      </Box>

      <Divider
        sx={{
          gridColumn: { xs: "1 / -1", lg: "2" },
          gridRow: "2",
          my: { xs: 0.5, lg: 1.5 },
          borderColor: theme.palette.divider,
        }}
      />

      <Box
        sx={{
          gridColumn: { xs: "1 / -1", lg: "2" },
          gridRow: "3",
          textAlign: { xs: "center", lg: "left" },
          pb: { lg: 0.5 },
        }}
      >
        <Typography component="h3" sx={trackTitleSx}>
          {track?.title ?? "Sin reproducción"}
        </Typography>
        {track && (
          <Typography
            variant="body2"
            sx={{ mt: 0.75, color: "text.secondary" }}
          >
            {track.number} / {album.totalTracks}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const NowPlayingView = ({
  data,
  actions,
  capabilities,
}: NowPlayingViewProps) => {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  const { album, track, mode, volume, muted } = data;

  const isSpinning = mode === "playing" || mode === "paused";
  const discImage =
    album.discArt || album.coverArt || "/cd-placeholder-big.png";

  return (
    <Box
      component="section"
      aria-label="Now Playing"
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2.5, sm: 4, lg: 4, xl: 6 },
        py: { xs: 3, sm: 4, lg: 4, xl: 5 },
        color: "text.primary",
        mt: VERTICAL_LIFT,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `1px solid ${alpha(accent, 0.16)}`,
            backgroundColor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          <AlbumIcon sx={{ fontSize: 18 }} />
        </Box>
        <Typography
          component="h1"
          variant="subtitle1"
          sx={{
            fontSize: { xs: 15, sm: 16 },
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          Now Playing
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 3, sm: 4, lg: 4, xl: 6 },
          mt: { xs: 3, sm: 4, lg: 2 },
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            order: { xs: 0, lg: 1 },
            flexShrink: 0,
            width: DISC_SIZE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CdDisc imageSrc={discImage} spinning={isSpinning} />
        </Box>

        <Box
          sx={{
            order: { xs: 1, lg: 0 },
            flex: 1,
            width: "100%",
            minWidth: 0,
            maxWidth: { lg: 640, xl: 720 },
            alignSelf: { lg: "center" },
          }}
        >
          <AlbumPanel album={album} track={track} />
        </Box>
      </Box>

      <Box sx={{ mt: { xs: 3, sm: 4, lg: 4, xl: 5 } }}>
        <PlaybackControls
          track={track}
          mode={mode}
          volume={volume}
          muted={muted}
          actions={actions}
          capabilities={capabilities}
        />
      </Box>
    </Box>
  );
};

export default NowPlayingView;
