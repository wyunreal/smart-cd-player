/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import {
  alpha,
  Box,
  Collapse,
  Divider,
  Fade,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { DataRepositoryContext } from "@/app/providers/data-repository";
import { useContext, useEffect, useState } from "react";
import { CloseIcon } from "@/app/icons";
import CdDetailsDialog from "./cd-details-dialog";
import Album from "./album";

const DETAILS_PANEL_WIDTH = 300;

const CdDetails = ({
  cdId,
  onDialogClosed,
}: {
  cdId: number | null;
  onDialogClosed: () => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { getCdById } = useContext(DataRepositoryContext);
  const cd = cdId !== null ? getCdById(cdId) : null;

  const [animationDriver, setAnimationDriver] = useState<boolean>(!!cd);
  const [displayedCd, setDisplayedCd] = useState(cd);

  useEffect(() => {
    if (cd !== null) {
      setDisplayedCd(cd);
      setAnimationDriver(true);
    } else if (displayedCd !== null) {
      setAnimationDriver(false);
      const timer = setTimeout(() => {
        setDisplayedCd(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cd, displayedCd]);

  return isMobile ? (
    <CdDetailsDialog cdId={cdId} onDialogClosed={onDialogClosed} />
  ) : (
    <Collapse timeout={500} orientation="horizontal" in={animationDriver}>
      {displayedCd && (
        <Box
          sx={{
            width: `${DETAILS_PANEL_WIDTH + 16}px`,
          }}
        >
          <Box
            sx={{
              mx: 2,
              position: "absolute",
              width: `${DETAILS_PANEL_WIDTH}px`,
            }}
          >
            <Fade timeout={500} in={animationDriver}>
              <Paper>
                <div
                  style={{
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ filter: "blur(16px)" }}>
                    <img
                      src={
                        displayedCd.art?.album?.uri || "/cd-placeholder-big.png"
                      }
                      style={{
                        height: `${DETAILS_PANEL_WIDTH}px`,
                        width: "100%",
                      }}
                    />
                  </div>
                </div>
                <Box
                  sx={{
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    marginTop: "-307px",
                    paddingTop: 1,
                    position: "relative",
                    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.7)} 190px, ${alpha(theme.palette.background.paper, 1)} 250px)`,
                    borderBottomRightRadius: "8px",
                    borderBottomLeftRadius: "8px",
                  }}
                >
                  <Box
                    paddingBottom={2}
                    minWidth={`${DETAILS_PANEL_WIDTH}px`}
                    sx={{ marginTop: "203px" }}
                  >
                    <List
                      sx={{
                        maxHeight: "calc(100dvh - 404px)",
                        maxWidth: DETAILS_PANEL_WIDTH,
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
                      {displayedCd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem sx={{ my: "-4px" }}>
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
                <div style={{ position: "absolute", top: 80, left: 16 }}>
                  <Album
                    imageUri={
                      displayedCd.art?.album?.uri || "/cd-placeholder-big.png"
                    }
                    size={100}
                  />
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 16,
                    right: 48,
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant={displayedCd.title.length <= 35 ? "h5" : "body1"}
                    sx={{
                      textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {(displayedCd.diskAmount || 1) > 1
                      ? `${displayedCd.title}, Disc ${displayedCd.diskNumber}`
                      : displayedCd.title}
                  </Typography>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: 80,
                    left: 136,
                    right: 16,
                  }}
                >
                  <Typography
                    sx={{
                      textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                    }}
                  >
                    {displayedCd.artist}
                  </Typography>
                  <Typography
                    sx={{
                      textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                    }}
                  >
                    {displayedCd.genre}
                  </Typography>
                  <Typography
                    sx={{
                      textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                    }}
                  >
                    {displayedCd.year != 0 ? displayedCd.year : ""}
                  </Typography>
                </div>
                <Box sx={{ position: "absolute", top: "8px", right: "8px" }}>
                  <IconButton
                    onClick={() => {
                      setAnimationDriver(false);
                      setTimeout(() => {
                        onDialogClosed();
                      }, 500);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Paper>
            </Fade>
          </Box>
        </Box>
      )}
    </Collapse>
  );
};

export default CdDetails;
