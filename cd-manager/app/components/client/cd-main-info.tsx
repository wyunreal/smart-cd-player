import { Box, Typography, useTheme } from "@mui/material";
import Image from "next/image";
import { Cd } from "@/api/types";

const CdMainInfo = ({ cd }: { cd: Cd | null; onDialogClosed: () => void }) => {
  const theme = useTheme();

  return (
    cd && (
      <div>
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
            right: 48,
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
            {cd.year != 0 ? cd.year : ""}
          </Typography>
        </div>
      </div>
    )
  );
};

export default CdMainInfo;
