"use client";

import { DataRepositoryContext } from "@/app/providers/data-repository";
import type { VirtualSlot } from "@/lib/virtual-slots";
import { getPlayDiscOrder } from "@/api/player-remote/command-factory";
import { CloseIcon } from "@/app/icons";
import {
  alpha,
  Box,
  Drawer,
  Fab,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { PlayArrowRounded, QueueMusic } from "@mui/icons-material";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NOW_PLAYING_CD_LIST_WIDTH,
} from "./constants";

const getCdTitle = (slot: VirtualSlot): string => {
  const cd = slot.cd;
  if (!cd) return "";
  return (cd.diskAmount ?? 1) > 1
    ? `${cd.title}, Disc ${cd.diskNumber}`
    : cd.title;
};

const CdListContent = ({ onClose }: { onClose?: () => void }) => {
  const theme = useTheme();
  const {
    visibleSlots,
    irRemoteClients,
    commandPlayer,
    commandDisplayState,
    lastPlayedSlots,
    setLastPlayedSlots,
    setSelectedVirtualNumber,
  } = useContext(DataRepositoryContext);

  const currentMode = commandDisplayState?.mode;
  const isCurrentPlaying =
    (currentMode === "playing" || currentMode === "paused") &&
    commandDisplayState?.disc != null;

  const listRef = useRef<HTMLDivElement | null>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  const currentSlot = useMemo(() => {
    if (
      !isCurrentPlaying ||
      commandPlayer === null ||
      commandDisplayState?.disc == null
    ) {
      return null;
    }

    return (
      visibleSlots.find(
        (slot) =>
          slot.playerRemoteIndex === commandPlayer &&
          slot.slot === commandDisplayState.disc,
      ) ?? null
    );
  }, [
    isCurrentPlaying,
    commandPlayer,
    commandDisplayState?.disc,
    visibleSlots,
  ]);

  useEffect(() => {
    if (!currentSlot) return;

    const container = listRef.current;
    const item = selectedItemRef.current;
    if (!container || !item) return;

    const frame = requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const top = itemRect.top - containerRect.top + container.scrollTop;
      const bottom = top + itemRect.height;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;
      const margin = 8;

      if (top < viewTop + margin) {
        container.scrollTo({
          top: Math.max(0, top - margin),
          behavior: "smooth",
        });
      } else if (bottom > viewBottom - margin) {
        container.scrollTo({
          top: Math.max(0, bottom - container.clientHeight + margin),
          behavior: "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [currentSlot, visibleSlots]);

  const handlePlay = useCallback(
    async (slot: VirtualSlot) => {
      // Close the drawer immediately on tap; playback continues in the
      // background even if the IR request takes time.
      onClose?.();

      const client = irRemoteClients[slot.playerIndex] ?? null;
      if (!client) return;

      const sequence = getPlayDiscOrder(slot.slot);
      if (!client.canExecuteSequence(sequence)) return;

      try {
        await client.sendOrder(sequence);
        const newLastPlayed = [...lastPlayedSlots];
        newLastPlayed[slot.playerIndex] = slot.slot;
        setLastPlayedSlots(newLastPlayed);
        setSelectedVirtualNumber(slot.number);
      } catch (e) {
        console.error("Failed to play CD from now playing list", e);
      }
    },
    [
      irRemoteClients,
      lastPlayedSlots,
      setLastPlayedSlots,
      setSelectedVirtualNumber,
      onClose,
    ],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          pt: { xs: 1.5, sm: 2 },
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h6">All CDs</Typography>
          <Typography variant="caption" color="text.secondary">
            {`${visibleSlots.length} ${
              visibleSlots.length === 1 ? "CD" : "CDs"
            }`}
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} aria-label="Close CD list">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Box
        ref={listRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 1,
          py: 1,
        }}
      >
        {visibleSlots.map((slot, index) => {
          const cd = slot.cd;
          if (!cd) return null;

          const client = irRemoteClients[slot.playerIndex] ?? null;
          const canPlay =
            client?.canExecuteSequence(getPlayDiscOrder(slot.slot)) ?? false;
          const isCurrent = currentSlot?.number === slot.number;

          const meta = [
            `${cd.tracks.length} ${
              cd.tracks.length === 1 ? "track" : "tracks"
            }`,
            cd.genre,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Box key={slot.number}>
              {slot.isFirstOfPlayer && (
                <Typography
                  variant="overline"
                  sx={{
                    display: "block",
                    px: 1,
                    pt: index === 0 ? 0 : 1.5,
                    color: "text.secondary",
                  }}
                >
                  {`Player ${slot.playerRemoteIndex}`}
                </Typography>
              )}

              <Box
                ref={isCurrent ? selectedItemRef : undefined}
                aria-current={isCurrent ? "true" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isCurrent
                    ? alpha(theme.palette.primary.main, 0.5)
                    : "transparent",
                  backgroundColor: isCurrent
                    ? alpha(theme.palette.primary.main, 0.12)
                    : "transparent",
                  boxShadow: isCurrent
                    ? `inset 3px 0 0 ${theme.palette.primary.main}`
                    : "none",
                  transition: "background-color 150ms ease",
                  "&:hover": {
                    backgroundColor: isCurrent
                      ? alpha(theme.palette.primary.main, 0.16)
                      : theme.palette.action.hover,
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.action.hover,
                  }}
                >
                  <Box
                    component="img"
                    src={
                      cd.art?.album?.uri150 ||
                      cd.art?.album?.uri ||
                      "/cd-placeholder-small.png"
                    }
                    alt={`Cover of ${getCdTitle(slot)} by ${cd.artist}`}
                    loading="lazy"
                    sx={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  {canPlay && (
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        void handlePlay(slot);
                      }}
                      aria-label={`Play ${getCdTitle(slot)}`}
                      size="small"
                      sx={{
                        position: "absolute",
                        right: 2,
                        bottom: 2,
                        width: 28,
                        height: 28,
                        p: 0.25,
                        color: theme.palette.primary.main,
                        backgroundColor: alpha(
                          theme.palette.background.paper,
                          0.78,
                        ),
                        backdropFilter: "blur(4px)",
                        "&:hover": {
                          backgroundColor: theme.palette.background.paper,
                        },
                      }}
                    >
                      <PlayArrowRounded fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {getCdTitle(slot)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {cd.artist}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {meta}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}

        {visibleSlots.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ p: 2, textAlign: "center" }}
          >
            No CDs assigned to any player.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const NowPlayingCdList = () => {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("xxl"));
  const [open, setOpen] = useState(false);

  if (isWide) {
    return (
      <Box
        component="aside"
        aria-label="CDs in players"
        sx={{
          position: "fixed",
          top: 64,
          right: 0,
          bottom: 0,
          width: NOW_PLAYING_CD_LIST_WIDTH,
          zIndex: theme.zIndex.drawer,
          display: "flex",
          flexDirection: "column",
          borderLeft: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.82),
          backdropFilter: "blur(20px)",
          boxShadow: theme.shadows[8],
          overflow: "hidden",
        }}
      >
        <CdListContent />
      </Box>
    );
  }

  return (
    <>
      <Fab
        aria-label="Open CD list"
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 80,
          right: 16,
          zIndex: theme.zIndex.speedDial,
        }}
      >
        <QueueMusic />
      </Fab>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: "min(88vw, 380px)", sm: 380 },
            display: "flex",
            flexDirection: "column",
            pt: "env(safe-area-inset-top)",
          },
        }}
      >
        <CdListContent onClose={() => setOpen(false)} />
      </Drawer>
    </>
  );
};

export default NowPlayingCdList;
