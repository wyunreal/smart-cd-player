import { Cd } from "@/api/types";
import { Box, Typography } from "@mui/material";
import Album from "./album";

const CdRow = ({ cd }: { cd: Cd }) => {
  return (
    <Box
      sx={{
        display: "flex",
      }}
    >
      <Box sx={{ marginRight: "16px" }}>
        <Album
          imageUri={cd.art?.album?.uri150 || "/cd-placeholder-big.png"}
          size={104}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography>{cd.artist}</Typography>
        <Typography fontSize={24}>
          {(cd.diskAmount || 1) > 1
            ? `${cd.title}, Disc ${cd.diskNumber}`
            : cd.title}
        </Typography>
        <Typography>{`${cd.year} - ${cd.genre}`}</Typography>
        <Typography>{`Tracks: ${cd.tracks.length}`}</Typography>
      </Box>
    </Box>
  );
};

export default CdRow;
