/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import {
  alpha,
  Box,
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

import ResponsiveDialog from "./dialog/responsive-dialog";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { useContext } from "react";
import { PlayCircleOutlineOutlinedIcon } from "@/app/icons";
import Album from "./album";

type CdDetailsDialogProps = {
  cdId: number | null;
  onDialogClosed: () => void;
  onTrackPlayClick?: (trackIndex: number) => void;
  isTrackPlaySupported?: (trackNumber: number) => boolean;
};

const CdDetailsDialog = ({
  cdId,
  onDialogClosed,
  onTrackPlayClick,
  isTrackPlaySupported = () => true,
}: CdDetailsDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { getCdById } = useContext(DataRepositoryContext);
  const cd = cdId !== null ? getCdById(cdId) : null;

  return (
    <>
      <ResponsiveDialog
        isOpen={cdId !== null}
        onClose={onDialogClosed}
        title={
          (cd?.diskAmount || 1) > 1
            ? `${cd?.title}, Disc ${cd?.diskNumber}`
            : cd?.title || "Album details"
        }
        forcedHeight={isMobile ? undefined : 500}
        noHeader
        noPadding
      >
        {cd && (
          <Box
            sx={{
              position: "relative",
              height: "100%",
            }}
          >
            <div
              style={{
                filter: "blur(16px)",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "230px",
                overflow: "hidden",
                zIndex: 0,
              }}
            >
              <img
                src={cd.art?.album?.uri || "/cd-placeholder-big.png"}
                style={{
                  height: "230px",
                  width: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: `${alpha(theme.palette.background.default, 0.5)}`,
                zIndex: 1,
              }}
            >
              <Box paddingBottom={2} sx={{ 
                  marginTop: isMobile ? "254px" : "238px",
                  height: isMobile ? "calc(100% - 254px)" : "calc(100% - 238px)",
                  display: "flex",
                  flexDirection: "column"
                }}>
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
                    flex: 1,
                    // maxHeight: isMobile ? "calc(100vh - 270px)" : "240px",  <-- remove explicit max height, let flex handle it
                  }}
                >
                  <Box m={2}>
                    <List>
                      {cd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem sx={{ paddingX: 0, alignItems: "flex-start" }}>
                            {onTrackPlayClick && (
                              <Collapse
                                in={isTrackPlaySupported(index + 1)}
                                orientation="horizontal"
                              >
                                <IconButton
                                  color="primary"
                                  sx={{
                                    mr: isMobile ? 0 : 2,
                                  }}
                                  onClick={() => onTrackPlayClick(index)}
                                  disabled={!isTrackPlaySupported(index + 1)}
                                >
                                  <PlayCircleOutlineOutlinedIcon />
                                </IconButton>
                              </Collapse>
                            )}
                            <ListItemText sx={{ my: "8px" }}>
                              <Box sx={{ display: "flex", alignItems: "start" }}>
                                <Typography sx={{ minWidth: "32px" }}>
                                  {index + 1}.
                                </Typography>
                                <Typography>{track.title}</Typography>
                              </Box>
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
            <div style={{ position: "absolute", top: 64, left: 18, zIndex: 2 }}>
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
                left: isMobile ? 176 : 192,
                right: 32,
                height: "144px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "end",
                zIndex: 2,
              }}
            >
              <Typography
                variant={isMobile ? "body1" : "h6"}
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {(cd.diskAmount || 1) > 1
                  ? `${cd.title}, Disc ${cd.diskNumber}`
                  : cd.title}
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
