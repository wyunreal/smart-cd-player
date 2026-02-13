/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { PlayerSlot } from "@/app/providers/data-repository";
import {
  ArrowForwardIcon,
  ListIcon,
  PlayCircleOutlineOutlinedIcon,
} from "@/app/icons";
import {
  alpha,
  Box,
  Button,
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

const SelectedSlotDetails = ({
  slot,
  width,
  relatedSlots,
  onRelatedAlbumClick,
  onTrackPlay,
}: {
  slot: PlayerSlot;
  width: number;
  relatedSlots: PlayerSlot[];
  onRelatedAlbumClick: (slot: PlayerSlot) => void;
  onTrackPlay: (trackNumber: number) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [cdIdForTracksDialog, setCdIdForTracksDialog] = useState<number | null>(
    null,
  );

  const isHorizontalLayout = width >= 617;
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
                  <div style={{ maxHeight: 0 }}>
                    <List>
                      <Divider />
                      {slot.cd.tracks.map((track, i) => (
                        <div key={i}>
                          <ListItem sx={{ paddingX: 0, paddingY: "4px" }}>
                            <IconButton
                              sx={{ mr: isMobile ? 0 : 1 }}
                              onClick={() => onTrackPlay(i + 1)}
                            >
                              <PlayCircleOutlineOutlinedIcon
                                fontSize="small"
                                color="primary"
                              />
                            </IconButton>
                            <ListItemText>
                              <Typography variant="body2">
                                {track.title}
                              </Typography>
                            </ListItemText>
                          </ListItem>
                          <Divider />
                        </div>
                      ))}
                    </List>
                  </div>
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
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default SelectedSlotDetails;
