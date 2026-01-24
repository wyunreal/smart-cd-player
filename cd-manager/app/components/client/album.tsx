import { Box } from "@mui/material";
import Image from "next/image";

const Album = ({ imageUri, size }: { imageUri: string; size: number }) => {
  return (
    <Box
      sx={{
        borderRadius: "8px",
        borderColor: "white",
        border: "2px solid",
        height: size + 4,
      }}
    >
      <Image
        width={size}
        height={size}
        src={imageUri || "/cd-placeholder-big.png"}
        alt="Album big art"
        style={{
          borderRadius: "6px",
        }}
      />
    </Box>
  );
};

export default Album;
