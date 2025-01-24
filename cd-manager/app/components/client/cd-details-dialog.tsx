import {
  alpha,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import ResponsiveDialog from "./dialog/responsive-dialog";
import { DataRepositoryContext } from "@/providers/data-repository";
import { useContext } from "react";

const CdDetailsDialog = ({
  cdId,
  onDialogClosed,
}: {
  cdId: number | null;
  onDialogClosed: () => void;
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
        forcedHeight={isMobile ? undefined : 600}
      >
        {cd && (
          <Box
            sx={{
              position: "relative",
              height: "calc(100vh - 46px)",
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
                inset: isMobile ? "-16px" : "-32px",
                background: `${alpha(theme.palette.background.default, 0.5)}`,
              }}
            >
              <Box paddingBottom={2} sx={{ marginTop: "254px" }}>
                <Box
                  sx={{
                    overflow: "auto",
                    maxHeight: isMobile
                      ? "calc(100vh - 285px)"
                      : "calc(100vh - 524px)",
                  }}
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
                {cd.year != 0 ? cd.year : ""}
              </Typography>
            </div>
          </Box>
        )}
      </ResponsiveDialog>
    </>
  );
};

export default CdDetailsDialog;
