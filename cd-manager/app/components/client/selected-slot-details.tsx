import { PlayerSlot } from "@/app/hooks/use-player-content-provider-props";
import { ArrowForwardIcon } from "@/app/icons";
import { Box, Typography, useTheme } from "@mui/material";
import HorizontalScroll from "./horizontal-scroll";

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

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        margin: 2,
      }}
    >
      {slot?.cd ? (
        <Box>
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
            {ottherAlbums.length > 0 && (
              <>
                <Box m={2} display={"flex"}>
                  <Typography>More</Typography>
                  <ArrowForwardIcon />
                </Box>
                <HorizontalScroll
                  width={`calc(${width}px - 181px)`}
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
              </>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default SelectedSlotDetails;
