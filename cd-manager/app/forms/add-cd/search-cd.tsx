"use client";

import React, { useState } from "react";
import {
  TextField,
  Box,
  CircularProgress,
  Stack,
  IconButton,
} from "@mui/material";
import { AddCdData } from "./types";
import { StepErrors } from "@/app/components/client/flow";
import { SearchOutlinedIcon } from "@/app/icons";

export const validate = (data: AddCdData) => {
  let tempErrors = { cd: "" };
  if (!data.cd) {
    tempErrors.cd =
      "CD not selected yet, please perform a search by entering a valid CD bar code.";
  }
  const hasErrors = Object.values(tempErrors).some((x) => x !== "");
  return hasErrors ? tempErrors : null;
};

const SearchCdForm = ({
  data,
  errors,
  onDataChanged,
}: {
  data?: AddCdData | null;
  errors: StepErrors;
  onDataChanged: (data: AddCdData) => void;
}) => {
  const [barCode, setBarCode] = useState(data ? data.barCode : "");
  const [cd, setCd] = useState(data?.cd);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const searchByBarcode = async () => {
    if (!barCode.trim()) return;

    setLoading(true);
    setSearchError("");
    try {
      const response = await fetch(
        `/api/discogs?barcode=${encodeURIComponent(barCode)}`,
      );
      const result = await response.json();

      console.log("Discogs search result:", result);

      if (response.ok) {
        setSearchError("");
        onDataChanged({ ...data, barCode });
      } else if (response.status === 429) {
        setSearchError(
          result.error ||
            "Discogs API rate limit exceeded. Please try again later.",
        );
      } else {
        setSearchError(result.error || "Error performing search on Discogs");
      }
    } catch (error) {
      console.error("Search error:", error);
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
    </Box>
  );
};

export default SearchCdForm;
