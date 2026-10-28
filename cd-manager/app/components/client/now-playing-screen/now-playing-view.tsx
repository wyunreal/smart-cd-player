"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AlbumIcon, ListIcon } from "@/app/icons";
import ResponsiveDialog from "../dialog/responsive-dialog";
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
  // Same size as the artist name in the album panel.
  fontSize: { xs: 16, sm: 18, lg: 20, xl: 22 },
  fontWeight: 500,
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
} as const;

const DISC_SIZE = {
  // The stacked layouts use the full content width; the vertical layout lets
  // that width define the full disc size and crops it when height is tight.
  xs: "100%",
  sm: "100%",
  lg: "min(30vw, 380px)",
  xl: "min(34vw, 500px)",
} as const;

/**
 * In the stacked layouts the whole column is pinned to the bottom of the
 * viewport. The row starts 24px below the content top, so a full disc sits at
 * that distance from the app bar; if there is not enough height, the disc
 * wrapper shrinks and the disc loses visibility at the top.
 */
const VERTICAL_LIFT = {
  xs: "-70px",
  sm: "-86px",
  lg: 0,
} as const;

/** How far the cut-line highlight sticks out above and below the disc. */
const CUT_LINE_OVERHANG = 24;

type AlbumPanelProps = {
  album: NowPlayingAlbumView;
  track: NowPlayingTrackView | null;
  onOpenTracks: () => void;
};

const AlbumPanel = ({ album, track, onOpenTracks }: AlbumPanelProps) => {
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
          alt={`Cover of ${album.title} by ${album.artist}`}
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
          Album
        </Typography>
        <Typography component="h2" sx={albumTitleSx}>
          {album.title}
        </Typography>
        <Typography
          aria-hidden={!album.artist}
          sx={{
            mt: 0.25,
            fontSize: { xs: 16, sm: 18, lg: 20, xl: 22 },
            color: "text.secondary",
            visibility: album.artist ? "visible" : "hidden",
          }}
        >
          {album.artist || "\u00a0"}
        </Typography>
        <Typography
          variant="body2"
          aria-hidden={meta.length === 0}
          sx={{
            mt: 1,
            color: "text.secondary",
            fontSize: { xs: 12, sm: 13, xl: 14 },
            visibility: meta.length > 0 ? "visible" : "hidden",
          }}
        >
          {meta.length > 0 ? meta.join(" · ") : "\u00a0"}
        </Typography>
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
          gridColumn: "2",
          gridRow: "3",
          textAlign: "left",
          pb: { lg: 0.5 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            minWidth: 0,
          }}
        >
          <Typography
            component="h3"
            sx={{
              ...trackTitleSx,
              flex: 1,
              minWidth: 0,
              // Keep two lines reserved so a one-line placeholder or a short
              // track title cannot change the height of the stacked layout.
              minHeight: "2.4em",
            }}
          >
            {track?.title ?? "Nothing playing"}
          </Typography>
          {/* Keep the list icon on the first line, not centred against the
              whole two-line title block. */}
          <Box
            sx={{
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              height: "1.2em",
              mt: 0.5,
              flexShrink: 0,
              fontSize: { xs: 16, sm: 18, lg: 20, xl: 22 },
            }}
          >
            <IconButton
              onClick={onOpenTracks}
              aria-label="Open track list"
              size="small"
              sx={{
                display: { xs: "inline-flex", sm: "inline-flex", lg: "none" },
                color: "text.secondary",
                "&&&": { color: theme.palette.text.secondary },
                flexShrink: 0,
                p: 0.5,
              }}
            >
              <ListIcon sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.75,
          }}
        >
          <Typography
            variant="body2"
            aria-hidden={!track}
            sx={{
              color: "text.secondary",
              visibility: track ? "visible" : "hidden",
            }}
          >
            {track ? `${track.number} / ${album.totalTracks}` : "\u00a0"}
          </Typography>
          <IconButton
            onClick={onOpenTracks}
            aria-label="Open track list"
            size="small"
            disabled={!track}
            sx={{
              display: { xs: "none", sm: "none", lg: "inline-flex" },
              color: "text.secondary",
              "&&&": { color: theme.palette.text.secondary },
              flexShrink: 0,
              ml: 0.5,
              visibility: track ? "visible" : "hidden",
            }}
          >
            <ListIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
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
  const [tracksOpen, setTracksOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const discWrapperRef = useRef<HTMLDivElement | null>(null);
  const [cutLine, setCutLine] = useState<{
    top: number;
    height: number;
  } | null>(null);

  const { album, track, tracks, mode, volume, muted } = data;

  const discImage =
    album.discArt || album.coverArt || "/cd-placeholder-big.png";

  // Wide layouts can clip the disc on the right to keep the album column at
  // 500px. Mark the cut with a thin vertical highlight only when it happens.
  useEffect(() => {
    const section = sectionRef.current;
    const disc = discWrapperRef.current;
    if (!section || !disc) return;

    const measure = () => {
      if (!window.matchMedia("(min-width: 1200px)").matches) {
        setCutLine(null);
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const discRect = disc.getBoundingClientRect();
      const radius = Math.min(discRect.width, discRect.height) / 2;
      const centerX = discRect.left + discRect.width / 2;
      const centerY = discRect.top + discRect.height / 2;
      const dx = sectionRect.right - centerX;

      if (dx <= 0 || dx >= radius) {
        setCutLine(null);
        return;
      }

      const halfChord = Math.sqrt(Math.max(0, radius * radius - dx * dx));
      const chordHeight = halfChord * 2;
      if (chordHeight < 2) {
        setCutLine(null);
        return;
      }

      setCutLine({
        top: centerY - halfChord - CUT_LINE_OVERHANG - sectionRect.top,
        height: chordHeight + CUT_LINE_OVERHANG * 2,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(disc);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Box
      ref={sectionRef}
      component="section"
      aria-label="Now Playing"
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flex: { xs: "0 0 auto", sm: "0 0 auto", lg: 1 },
        // Pin the stacked column to the bottom of the viewport. The disc is
        // the only flexible element, so when height is missing it is the part
        // that gets cropped upwards.
        height: {
          xs: "calc(100dvh - 18px)",
          sm: "calc(100dvh - 10px)",
          lg: "auto",
        },
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2.5, sm: 4, lg: 4, xl: 6 },
        py: { xs: 3, sm: 4, lg: 4, xl: 5 },
        // In the wide layout a shifted disc must be clipped instead of adding
        // a horizontal scrollbar.
        overflowX: { lg: "clip", xl: "clip" },
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
          justifyContent: {
            xs: "flex-start",
            sm: "flex-start",
            lg: "space-between",
          },
          gap: { xs: 3, sm: 4, lg: 4, xl: 6 },
          mt: { xs: 3, sm: 4, lg: 2 },
          minHeight: 0,
        }}
      >
        <Box
          ref={discWrapperRef}
          sx={{
            order: { xs: 0, lg: 1 },
            flexShrink: { xs: 1, sm: 1, lg: 0 },
            width: DISC_SIZE,
            maxWidth: "100%",
            minHeight: 0,
            display: "flex",
            alignItems: { xs: "flex-end", sm: "flex-end", lg: "center" },
            justifyContent: "center",
          }}
        >
          <CdDisc imageSrc={discImage} mode={mode} />
        </Box>

        <Box
          sx={{
            order: { xs: 1, lg: 0 },
            flex: { xs: "0 0 auto", sm: "0 0 auto", lg: 1 },
            width: "100%",
            minWidth: { xs: 0, sm: 0, lg: 500, xl: 500 },
            maxWidth: { lg: 640, xl: 720 },
            alignSelf: { lg: "center" },
          }}
        >
          <AlbumPanel
            album={album}
            track={track}
            onOpenTracks={() => setTracksOpen(true)}
          />
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
          onSearch={() => setTracksOpen(true)}
        />
      </Box>

      <ResponsiveDialog
        isOpen={tracksOpen}
        onClose={() => setTracksOpen(false)}
        title={album.title}
      >
        <List disablePadding>
          {tracks.map((item, index) => (
            <Box key={item.number}>
              <ListItemButton
                selected={track?.number === item.number}
                onClick={() => {
                  actions.onSelectTrack(index);
                  setTracksOpen(false);
                }}
              >
                <ListItemText primary={`${item.number}. ${item.title}`} />
              </ListItemButton>
              {index < tracks.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </ResponsiveDialog>

      {cutLine && (
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            right: 0,
            top: `${cutLine.top}px`,
            width: "1px",
            height: `${cutLine.height}px`,
            zIndex: 4,
            pointerEvents: "none",
            background: `linear-gradient(180deg, transparent 0%, ${alpha(
              accent,
              0.25,
            )} 2%, ${accent} 6%, ${accent} 94%, ${alpha(
              accent,
              0.25,
            )} 98%, transparent 100%)`,
          }}
        />
      )}
    </Box>
  );
};

export default NowPlayingView;
