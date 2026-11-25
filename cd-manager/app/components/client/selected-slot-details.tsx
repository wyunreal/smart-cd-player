/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { VirtualSlot } from "@/lib/virtual-slots";
import type { Track } from "@/api/types";
import {
  ArrowForwardIcon,
  ListIcon,
  PlayCircleOutlineOutlinedIcon,
} from "@/app/icons";
import {
  alpha,
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HorizontalScroll from "./horizontal-scroll";
import useResizeObserver from "@/app/hooks/use-resize-observer";
import CdDetailsDialog from "./cd-details-dialog";
import { useState } from "react";

const TrackColumn = ({
  tracks,
  startIndex,
  isMobile,
  onTrackPlay,
  isTrackPlaySupported,
}: {
  tracks: Track[];
  startIndex: number;
  isMobile: boolean;
  onTrackPlay: (trackNumber: number) => void;
  isTrackPlaySupported: (trackNumber: number) => boolean;
}) => (
  <div style={{ maxHeight: 0, minWidth: 0 }}>
    <List>
      <Divider />
      {tracks.map((track, index) => {
        const trackNumber = startIndex + index + 1;
        const supported = isTrackPlaySupported(trackNumber);

        return (
          <div key={trackNumber}>
            <ListItem
              sx={{
                paddingX: 0,
                paddingY: "4px",
                alignItems: "flex-start",
              }}
            >
              <Collapse in={supported} orientation="horizontal">
                <IconButton
                  sx={{
                    mr: isMobile ? 0 : 1,
                  }}
                  onClick={() => supported && onTrackPlay(trackNumber)}
                  disabled={!supported}
                >
                  <PlayCircleOutlineOutlinedIcon
                    fontSize="small"
                    color="primary"
                  />
                </IconButton>
              </Collapse>
              <ListItemText sx={{ my: "8px", minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "start" }}>
                  <Typography variant="body2" sx={{ minWidth: "32px" }}>
                    {`${trackNumber}.`}
                  </Typography>
                  <Typography variant="body2">{track.title}</Typography>
                </Box>
              </ListItemText>
            </ListItem>
            <Divider />
          </div>
        );
      })}
    </List>
  </div>
);

const SelectedSlotDetails = ({
  slot,
  width,
  relatedSlots,
  onRelatedAlbumClick,
  onTrackPlay,
  isTrackPlaySupported = () => true,
}: {
  slot: VirtualSlot;
  width: number;
  relatedSlots: VirtualSlot[];
  onRelatedAlbumClick: (slot: VirtualSlot) => void;
  onTrackPlay: (trackNumber: number) => void;
  isTrackPlaySupported?: (trackNumber: number) => boolean;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [cdIdForTracksDialog, setCdIdForTracksDialog] = useState<number | null>(
    null,
  );

  const isHorizontalLayout = width >= 617;
  const cdTracks = slot.cd?.tracks ?? [];
  const isTwoColumnTracks = isHorizontalLayout && width >= 1400;
  const tracksPerColumn = isTwoColumnTracks
    ? Math.ceil(cdTracks.length / 2)
    : cdTracks.length;
  const trackColumns = isTwoColumnTracks
    ? [cdTracks.slice(0, tracksPerColumn), cdTracks.slice(tracksPerColumn)]
    : [cdTracks];
  const { height, resizeRef } = useResizeObserver();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        margin: 2,
        marginBottom: 0,
      }}
    >
      {slot?.cd ? (
        <Box
          sx={
            isHorizontalLayout
              ? {
                  display: "flex",
                  flexDirection: "row",
                  flex: 1,
                }
              : {
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                }
          }
        >
          <Box
            sx={
              isHorizontalLayout
                ? {
                    borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    flex: 1,
                    marginLeft: 2,
                  }
                : {}
            }
          >
            <Box
              sx={{
                ml: isHorizontalLayout ? "-16px" : 0,
                mt: "-8px",
                mb: "8px",
              }}
            >
              <Typography variant="h6">
                {relatedSlots.length > 0
                  ? `All from ${relatedSlots[0].cd?.artist}`
                  : slot.cd.artist}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {`Player ${slot.playerRemoteIndex} · slot ${slot.slot}`}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                flex: 1,
                alignItems: "center",
                ml: isHorizontalLayout ? "-16px" : 0,
              }}
            >
              <img
                src={
                  relatedSlots.length > 0
                    ? relatedSlots[0].cd?.art?.artist?.uri150 ||
                      "/cd-placeholder-small.png"
                    : "/cd-placeholder-small.png"
                }
                width="70px"
                height="70px"
                style={{
                  borderRadius: "8px",
                  border: `2px solid ${theme.vars.palette.text.primary}`,
                }}
              />

              {relatedSlots.length > 0 && (
                <Box m={2} display={"flex"}>
                  <ArrowForwardIcon />
                </Box>
              )}

              {relatedSlots.length > 0 ? (
                <HorizontalScroll
                  width={
                    isHorizontalLayout
                      ? `calc(${width / 2}px - 144px)`
                      : `calc(${width}px - 144px)`
                  }
                  items={relatedSlots.map((s, i) => (
                    <img
                      key={s.cd?.id || i}
                      src={
                        s.cd?.art?.album?.uri150 || "/cd-placeholder-small.png"
                      }
                      width="70px"
                      height="70px"
                      style={{
                        marginBottom: "-7px",
                        borderRadius: "8px",
                        marginRight: "16px",
                        border: `2px solid ${theme.vars.palette.text.primary}`,
                        cursor: "pointer",
                      }}
                      onClick={() => onRelatedAlbumClick(s)}
                    />
                  ))}
                />
              ) : (
                <Box sx={{ marginLeft: 2 }}>
                  <Typography>{slot.cd.genre}</Typography>
                  <Typography variant="body2">
                    {slot.cd.year ? slot.cd.year : ""}
                  </Typography>
                  <Typography variant="body2">{`${slot.cd.tracks.length} tracks`}</Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box
            sx={
              isHorizontalLayout
                ? { marginLeft: 2, marginTop: 0, flex: 1, display: "flex" }
                : { marginTop: 2, marginRight: 2, flex: 1, display: "flex" }
            }
            ref={resizeRef}
          >
            {height > 150 ? (
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <Typography sx={{ mt: "-8px", mb: "8px" }} variant="h6">
                  Tracks
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                      display: "none",
                      scrollbarWidth: "none",
                      overflowStyle: "none",
                    },
                    scrollbarWidth: "none",
                    overflowStyle: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: isTwoColumnTracks
                        ? "minmax(0, 1fr) minmax(0, 1fr)"
                        : "minmax(0, 1fr)",
                      columnGap: isTwoColumnTracks ? 3 : 0,
                      alignItems: "start",
                    }}
                  >
                    {trackColumns.map((tracks, columnIndex) => (
                      <TrackColumn
                        key={columnIndex}
                        tracks={tracks}
                        startIndex={columnIndex * tracksPerColumn}
                        isMobile={isMobile}
                        onTrackPlay={onTrackPlay}
                        isTrackPlaySupported={isTrackPlaySupported}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : height > 40 && isHorizontalLayout ? (
              <>
                <Box sx={{ mt: "-8px", mb: "8px" }}>
                  <Typography variant="h6">Tracks</Typography>
                  <Typography
                    sx={{ mt: "19px" }}
                  >{`${slot.cd.tracks.length} tracks included in the album.`}</Typography>
                  <Button
                    sx={{ ml: "-6px", mt: "-4px" }}
                    startIcon={<ListIcon />}
                    onClick={() => setCdIdForTracksDialog(slot.cd?.id || null)}
                  >
                    Show tracks
                  </Button>
                </Box>
              </>
            ) : (
              <Box>
                <Button
                  sx={{ ml: "-6px" }}
                  startIcon={<ListIcon />}
                  onClick={() => setCdIdForTracksDialog(slot.cd?.id || null)}
                >
                  Tracks
                </Button>
              </Box>
            )}
            <CdDetailsDialog
              cdId={cdIdForTracksDialog}
              onDialogClosed={() => setCdIdForTracksDialog(null)}
              onTrackPlayClick={(trackIndex) => {
                onTrackPlay(trackIndex + 1);
              }}
              isTrackPlaySupported={isTrackPlaySupported}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default SelectedSlotDetails;
