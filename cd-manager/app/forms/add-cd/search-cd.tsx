"use client";

import React, { useState } from "react";
import {
  TextField,
  Box,
  CircularProgress,
  Stack,
  IconButton,
  Typography,
} from "@mui/material";
import { AddCdData } from "./types";
import { StepErrors } from "@/app/components/client/flow";
import { SearchOutlinedIcon } from "@/app/icons";
import { AlbumArt, Art, Cd } from "@/api/types";
import Album from "@/app/components/client/album";

export const validate = (data: AddCdData) => {
  let tempErrors = { cd: "" };
  if (!data.cd) {
    tempErrors.cd =
      "CD not selected yet, please perform a search by entering a valid CD bar code.";
  }
  const hasErrors = Object.values(tempErrors).some((x) => x !== "");
  return hasErrors ? tempErrors : null;
};

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
        <Typography fontSize={24}>{cd.title}</Typography>
        <Typography>{`${cd.year} - ${cd.genre}`}</Typography>
        <Typography>{`Tracks: ${cd.tracks.length}`}</Typography>
      </Box>
    </Box>
  );
};

const SearchCdForm = ({
  data,
  errors,
  onDataChanged,
  clearValidationErrors,
}: {
  data?: AddCdData | null;
  errors: StepErrors;
  onDataChanged: (data: AddCdData) => void;
  clearValidationErrors: () => void;
}) => {
  const [barCode, setBarCode] = useState(data ? data.barCode : "");
  const [cd, setCd] = useState<Cd | null | undefined>(data?.cd);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchByBarcode = async () => {
    if (!barCode.trim()) return;

    setLoading(true);
    setSearchError("");
    try {
      clearValidationErrors();
      const response = await fetch(
        `/api/discogs/search?barcode=${encodeURIComponent(barCode)}`,
      );
      const result = await response.json();

      if (response.ok) {
        if (result.cd) {
          setCd(result.cd);

          const artistResponse = await fetch(
            `/api/discogs/artist/pictures?artistName=${encodeURIComponent(result.cd.artist)}`,
          );
          const artistResult = await artistResponse.json();

          onDataChanged({
            ...data,
            barCode: result.cd.barCode,
            cd: result.cd,
            arts: result.cds.reduce((acc: Art[], cd: Cd) => {
              if (cd.art?.allImages?.length !== undefined) {
                acc.push(...cd.art.allImages);
              }
              return acc;
            }, []),
            artistArts: artistResult.images || [],
            artistName: result.cd.artist,
          });
        } else {
          setCd(null);
          onDataChanged({
            ...data,
            barCode,
            cd: undefined,
            arts: [],
            artistArts: [],
            artistName: "",
          });
          setSearchError("No CD found for the provided bar code.");
        }
      } else if (response.status === 429) {
        setSearchError(
          result.error ||
            "Discogs API rate limit exceeded. Please try again later.",
        );
      } else {
        setSearchError(result.error || "Error performing search on Discogs");
      }
    } catch (error) {
      setSearchError("Error performing search on Discogs");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchByBarcode();
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ margin: "16px 0" }}>
        <Stack direction="row" spacing={2}>
          <TextField
            required
            fullWidth
            id="barCode"
            label="Bar Code"
            name="barCode"
            autoFocus
            value={barCode}
            onChange={(e) => {
              setBarCode(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={searchByBarcode}
                    disabled={loading || !barCode.trim()}
                  >
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchOutlinedIcon />
                    )}
                  </IconButton>
                ),
              },
            }}
            error={!!errors?.cd || !!searchError}
            helperText={errors?.cd || searchError}
          />
        </Stack>
      </Box>
      <Box sx={{ margin: "16px 0" }}>
        {cd && (
          <>
            <Box sx={{ marginBottom: "8px" }}>
              <Typography>CD Found:</Typography>
            </Box>
            <CdRow cd={cd} />
          </>
        )}
      </Box>
    </Box>
  );
};

export default SearchCdForm;
