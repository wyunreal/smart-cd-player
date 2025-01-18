import {
  alpha,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { Cd } from "@/api/types";
import ResponsiveDialog from "./dialog/responsive-dialog";

const DETAILS_PANEL_WIDTH = 300;

const CdDetails = ({
  cd,
  onDialogClosed,
}: {
  cd: Cd | null;
  onDialogClosed: () => void;
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return isMobile ? (
    <>
      <ResponsiveDialog
        isOpen={cd !== null}
        onClose={onDialogClosed}
        title={cd?.title || "Album details"}
      >
        {cd && (
          <Box sx={{ position: "relative", height: "calc(100vh - 46px)" }}>
            <div
              style={{
                filter: "blur(16px)",
                marginTop: "-48px",
                marginLeft: "-48px",
                marginRight: "-48px",
              }}
            >
              <img
                src={cd.art?.albumBig || "/cd-placeholder-big.png"}
                style={{
                  height: "230px",
                  width: "100%",
                }}
              />
            </div>

            <Box
              sx={{
                position: "absolute",
                inset: "-16px",
                background: `${alpha(theme.palette.background.default, 0.5)}`,
              }}
            >
              <Box
                paddingBottom={2}
                minWidth={`${DETAILS_PANEL_WIDTH}px`}
                sx={{ marginTop: "254px" }}
              >
                <Box
                  sx={{ overflow: "auto", maxHeight: "calc(100vh - 285px)" }}
                >
                  <Box m={2}>
                    <List>
                      {cd.tracks.map((track, index) => (
                        <div key={index}>
                          <ListItem>
                            <ListItemText>{track.title}</ListItemText>
                          </ListItem>
                          <Divider />
                        </div>
                      ))}
                    </List>
                  </Box>
                </Box>
              </Box>
            </Box>
            <div style={{ position: "absolute", top: 64, left: 16 }}>
              <Box
                sx={{
                  borderRadius: "8px",
                  borderColor: "white",
                  border: "2px solid",
                  height: 144,
                }}
              >
                <Image
                  width={140}
                  height={140}
                  src={cd.art?.albumBig || "/cd-placeholder-big.png"}
                  alt="Album big art"
                  style={{
                    borderRadius: "6px",
                  }}
                />
              </Box>
            </div>
            <div
              style={{
                position: "absolute",
                top: 64,
                left: 186,
                right: 0,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {cd.artist}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {cd.genre}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                }}
              >
                {cd.year}
              </Typography>
            </div>
          </Box>
        )}
      </ResponsiveDialog>
    </>
  ) : (
    <>
      {cd && (
        <Box
          sx={{
            width: `${DETAILS_PANEL_WIDTH + 16}px`,
          }}
        >
          <Box sx={{ mx: 2, position: "absolute" }}>
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
                    src={cd.art?.albumBig || "/cd-placeholder-big.png"}
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
                    sx={{ maxHeight: "calc(100vh - 400px)", overflow: "auto" }}
                  >
                    {cd.tracks.map((track, index) => (
                      <div key={index}>
                        <ListItem sx={{ my: "-4px" }}>
                          <ListItemText>{track.title}</ListItemText>
                        </ListItem>
                        <Divider />
                      </div>
                    ))}
                  </List>
                </Box>
              </Box>
              <div style={{ position: "absolute", top: 80, left: 16 }}>
                <Box
                  sx={{
                    borderRadius: "8px",
                    borderColor: "white",
                    border: "2px solid",
                    height: 104,
                  }}
                >
                  <Image
                    width={100}
                    height={100}
                    src={cd.art?.albumBig || "/cd-placeholder-big.png"}
                    alt="Album big art"
                    style={{
                      borderRadius: "6px",
                    }}
                  />
                </Box>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 16,
                  right: 16,
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                  }}
                >
                  {cd.title}
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
                  {cd.artist}
                </Typography>
                <Typography
                  sx={{
                    textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                  }}
                >
                  {cd.genre}
                </Typography>
                <Typography
                  sx={{
                    textShadow: `1px 1px 1px ${theme.palette.background.default};`,
                  }}
                >
                  {cd.year}
                </Typography>
              </div>
            </Paper>
          </Box>
        </Box>
      )}
    </>
  );
};

export default CdDetails;
