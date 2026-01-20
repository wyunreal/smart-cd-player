"use client";

import React, { useState } from "react";
import { TextField, Button, Box, CircularProgress } from "@mui/material";
import { AddCdData } from "./types";
import { StepErrors } from "@/app/components/client/flow";

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

  const searchByBarcode = async () => {
    if (!barCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/discogs?barcode=${encodeURIComponent(barCode)}`,
      );
      const result = await response.json();

      console.log("Discogs search result:", result);

      if (response.ok) {
        console.log(`Found ${result.cds.length} CD(s)`);
      } else {
        console.error("Search error:", result.error);
      }
    } catch (error) {
      console.error("Failed to search CD:", error);
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
            onDataChanged({ ...data, barCode: e.target.value });
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          slotProps={{
            input: {
              endAdornment: loading ? <CircularProgress size={20} /> : null,
            },
          }}
        />
      </Box>
      <Button
        variant="contained"
        onClick={searchByBarcode}
        disabled={loading || !barCode.trim()}
        fullWidth
      >
        {loading ? "Searching..." : "Search CD"}
      </Button>
    </Box>
  );
};

export default SearchCdForm;
