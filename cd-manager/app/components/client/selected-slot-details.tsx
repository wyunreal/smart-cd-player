import { PlayerSlot } from "@/app/hooks/use-player-content-provider-props";
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
}: {
  slot: PlayerSlot;
  width: number;
  relatedSlots: PlayerSlot[];
  onRelatedAlbumClick: (slot: PlayerSlot) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const otherAlbums = relatedSlots.filter(
    (s) => s.cd?.title !== slot.cd?.title
  );

  const [cdIdForTracksDialog, setCdIdForTracksDialog] = useState<number | null>(
    null
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
                {otherAlbums.length > 0
                  ? `More from ${slot.cd.artist}`
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
                src={slot.cd.art?.artistSmall || "/cd-placeholder-small.png"}
                width="70px"
                height="70px"
                style={{
                  borderRadius: "8px",
                  border: `2px solid ${theme.vars.palette.text.primary}`,
                }}
              />

              {otherAlbums.length > 0 && (
                <Box m={2} display={"flex"}>
                  <ArrowForwardIcon />
                </Box>
              )}

              {otherAlbums.length > 0 ? (
                <HorizontalScroll
                  width={
                    isHorizontalLayout
                      ? `calc(${width / 2}px - 144px)`
                      : `calc(${width}px - 144px)`
                  }
                  items={otherAlbums.map((s) => (
                    <img
                      src={s.cd?.art?.albumSmall || "/cd-placeholder-small.png"}
                      width="70px"
                      height="70px"
                      style={{
                        marginBottom: "-7px",
                        borderRadius: "8px",
                        marginRight: "16px",
                        border: `2px solid ${theme.vars.palette.text.primary}`,
                      }}
                      onClick={() => onRelatedAlbumClick(s)}
                    />
                  ))}
                />
              ) : (
                <Box sx={{ marginLeft: 2 }}>
                  <Typography>{slot.cd.genre}</Typography>
                  <Typography>{slot.cd.year ? slot.cd.year : ""}</Typography>
                  <Typography>{`${slot.cd.tracks.length} tracks`}</Typography>
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
                      {slot.cd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem sx={{ paddingX: 0, paddingY: "4px" }}>
                            <IconButton
                              sx={{ mr: isMobile ? 0 : 1 }}
                              onClick={() => alert(`Play track &{index}`)}
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
            ) : height > 40 ? (
              <>
                <Box sx={{ mt: "-8px", mb: "8px" }}>
                  <Typography variant="h6">Tracks</Typography>
                  <Typography
                    sx={{ mt: "3px" }}
                  >{`${slot.cd.tracks.length} tracks included in the album.`}</Typography>
                  <Button
                    sx={{ ml: "-8px" }}
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
                  sx={{ ml: "-8px" }}
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
                alert(`Track ${trackIndex} clicked`);
              }}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default SelectedSlotDetails;
