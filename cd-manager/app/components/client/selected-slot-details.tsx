import { PlayerSlot } from "@/app/hooks/use-player-content-provider-props";
import { ArrowForwardIcon } from "@/app/icons";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import HorizontalScroll from "./horizontal-scroll";
import useResizeObserver from "@/app/hooks/use-resize-observer";

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
  const ottherAlbums = relatedSlots.filter(
    (s) => s.cd?.title !== slot.cd?.title
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
          {ottherAlbums.length > 0 && (
            <Box
              sx={
                isHorizontalLayout
                  ? {
                      borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
                    }
                  : {}
              }
            >
              <Box sx={{ mt: "-8px", mb: "8px" }}>
                <Typography variant="h6">
                  {`More from ${slot.cd.artist}`}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
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
                <Box m={2} display={"flex"}>
                  <ArrowForwardIcon />
                </Box>
                <HorizontalScroll
                  width={
                    isHorizontalLayout
                      ? `calc(${width / 2}px - 144px)`
                      : `calc(${width}px - 144px)`
                  }
                  items={ottherAlbums.map((s) => (
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
              </Box>
            </Box>
          )}
          <Box
            sx={
              isHorizontalLayout
                ? { marginX: 2, marginTop: 0, flex: 1 }
                : { marginTop: 2, marginRight: 2, flex: 1 }
            }
            ref={resizeRef}
          >
            {height > 150 ? (
              <Box sx={{ mt: "-8px", mb: "8px" }}>
                <Typography variant="h6">Tracks</Typography>
              </Box>
            ) : (
              <Box>Tracks button</Box>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default SelectedSlotDetails;
