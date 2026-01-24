import {
  alpha,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import ResponsiveDialog from "./dialog/responsive-dialog";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { useContext } from "react";
import { PlayCircleOutlineOutlinedIcon } from "@/app/icons";
import Album from "./album";

const CdDetailsDialog = ({
  cdId,
  onDialogClosed,
  onTrackPlayClick,
}: {
  cdId: number | null;
  onDialogClosed: () => void;
  onTrackPlayClick?: (trackIndex: number) => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { getCdById } = useContext(DataRepositoryContext);
  const cd = cdId ? getCdById(cdId) : null;

  return (
    <>
      <ResponsiveDialog
        isOpen={cd !== null}
        onClose={onDialogClosed}
        title={cd?.title || "Album details"}
        forcedHeight={isMobile ? undefined : 500}
        noHeader
      >
        {cd && (
          <Box
            sx={{
              position: "relative",
              height: "150vh",
            }}
          >
            <div
              style={{
                filter: "blur(16px)",
                marginTop: "-48px",
                marginLeft: "-48px",
                marginRight: "-48px",
              }}
            >
              <img
                src={cd.art?.album?.uri || "/cd-placeholder-big.png"}
                style={{
                  height: "230px",
                  width: "100%",
                }}
              />
            </div>

            <Box
              sx={{
                position: "absolute",
                inset: isMobile ? "-16px" : "-32px",
                background: `${alpha(theme.palette.background.default, 0.5)}`,
              }}
            >
              <Box paddingBottom={2} sx={{ marginTop: "254px" }}>
                <Box
                  sx={{
                    "&::-webkit-scrollbar": {
                      display: "none",
                      scrollbarWidth: "none",
                      overflowStyle: "none",
                    },
                    scrollbarWidth: "none",
                    overflowStyle: "none",
                    overflow: "auto",
                    maxHeight: isMobile ? "calc(100vh - 211px)" : "309px",
                  }}
                >
                  <Box m={2}>
                    <List>
                      {cd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem sx={{ paddingX: 0 }}>
                            {onTrackPlayClick && (
                              <IconButton
                                color="primary"
                                sx={{ mr: isMobile ? 0 : 2 }}
                                onClick={() => onTrackPlayClick(index)}
                              >
                                <PlayCircleOutlineOutlinedIcon />
                              </IconButton>
                            )}
                            <ListItemText sx={{ marginTop: "6px" }}>
                              {track.title}
                            </ListItemText>
                          </ListItem>
                          <Divider />
                        </div>
                      ))}
                    </List>
                  </Box>
                </Box>
              </Box>
            </Box>
            <div style={{ position: "absolute", top: 64, left: 2 }}>
              <Box>
                <Album
                  imageUri={cd.art?.album?.uri || "/cd-placeholder-big.png"}
                  size={140}
                />
              </Box>
            </div>
            <div
              style={{
                position: "absolute",
                top: 64,
                left: isMobile ? 160 : 176,
                right: 16,
                height: "144px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "end",
              }}
            >
              <Typography
                variant={isMobile ? "body1" : "h6"}
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {cd.title}
              </Typography>
              <Typography
                variant={isMobile ? "h4" : "h4"}
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {cd.artist}
              </Typography>
            </div>
          </Box>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default CdDetailsDialog;
