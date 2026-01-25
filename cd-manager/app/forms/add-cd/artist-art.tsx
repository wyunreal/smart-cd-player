"use client";

import { StepProps } from "@/app/components/client/flow";
import { AddCdData } from "./types";
import { Art } from "@/api/types";
import { Typography } from "@mui/material";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import ImageSelector from "@/app/components/client/image-selector";

const ArtistArtForm = ({ data, onDataChanged }: StepProps<AddCdData>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const arts = data.artistArts || [];

  const handleSelectionChange = (
    index: number | undefined,
    image: Art | undefined,
  ) => {
    onDataChanged({
      ...data,
      selectedArtistArtIndex: index,
      cd: data.cd
        ? { ...data.cd, art: { ...data.cd.art, artist: image } }
        : undefined,
    });
  };

  return (
    <>
      {isMobile && (
        <Typography sx={{ mb: 1, mt: "-16px" }}>
          Select artist picture:
        </Typography>
      )}
      <ImageSelector
        images={arts}
        selectedIndex={data.selectedArtistArtIndex}
        onSelectionChange={handleSelectionChange}
        maxHeight={isMobile ? "70vh" : "55vh"}
      />
    </>
  );
};

export default ArtistArtForm;
