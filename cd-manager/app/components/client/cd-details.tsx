import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { Cd } from "@/api/types";
import ResponsiveDialog from "./dialog/responsive-dialog";
import { ArrowRightIcon } from "@/app/icons";

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
        title="Album details"
      >
        {cd && (
          <>
            <img
              src={cd.art?.albumBig || ""}
              alt="Album big art"
              style={{
                width: "calc(100% + 32px)",
                aspectRatio: "initial",
                margin: "-16px",
              }}
            />
            <Box paddingBottom={2} paddingTop="12px">
              <List>
                {cd.tracks.map((track, index) => (
                  <>
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ArrowRightIcon sx={{ marginTop: "-7px" }} />
                      </ListItemIcon>
                      <ListItemText primary={track.title} />
                    </ListItem>
                    <Divider key={`divider${index}`} />
                  </>
                ))}
              </List>
            </Box>
          </>
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
          <Box sx={{ position: "relative", right: 2 }}>
            <Box sx={{ mx: 2, position: "absolute" }}>
              <Paper>
                <div
                  style={{
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    width={DETAILS_PANEL_WIDTH}
                    height={DETAILS_PANEL_WIDTH}
                    src={cd.art?.albumBig || ""}
                    alt="Album big art"
                  />
                </div>
                <Box sx={{ mx: 2, marginTop: 1 }}>
                  <Typography variant="h6">Tracks</Typography>
                </Box>
                <Box
                  paddingBottom={2}
                  marginTop="-8px"
                  minWidth={`${DETAILS_PANEL_WIDTH}px`}
                >
                  <ul>
                    {cd.tracks.map((track, index) => (
                      <li key={index} style={{ margin: "4px 0" }}>
                        {track.title}
                      </li>
                    ))}
                  </ul>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default CdDetails;
