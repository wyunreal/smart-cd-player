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
      >
        {cd && (
          <Box
            sx={{
              position: "relative",
              height: isMobile ? "calc(100dvh + 16px)" : "150vh",
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
                    maxHeight: isMobile ? "calc(100dvh - 223px)" : "309px",
                  }}
                >
                  <Box m={2}>
                    <List>
                      {cd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem
                            sx={{ paddingX: 0, alignItems: "flex-start" }}
                          >
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
                              <Box
                                sx={{ display: "flex", alignItems: "start" }}
                              >
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
                variant={cd.title.length <= 45 ? "h6" : "body2"}
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {(cd.diskAmount || 1) > 1
                  ? `${cd.title}, Disc ${cd.diskNumber}`
                  : cd.title}
              </Typography>
              <Typography
                variant={
                  cd.artist.length > 15
                    ? "body1"
                    : cd.artist.length >= 10
                      ? "h6"
                      : "h4"
                }
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
