"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Switch,
} from "@mui/material";
import musicGenres from "./genres";
import { CdInputData } from "@/api/types";
import { capitalizeFirstLetter } from "../util/string";

const CdForm = ({
  cd,
  onSubmit,
}: {
  cd?: CdInputData | null;
  onSubmit: (data: CdInputData, fetchCdDetails: boolean) => Promise<void>;
}) => {
  const [title, setTitle] = useState(cd ? cd.album : "");
  const [artist, setArtist] = useState(cd ? cd.artist : "");
  const [genre, setGenre] = useState(cd ? cd.genre : "");
  const [tracksNumber, setTracksNumber] = useState(cd ? cd.tracksNumber : 0);
  const [fetchDetails, setFetchDetails] = useState(true);
  const [errors, setErrors] = useState({
    title: "",
    author: "",
    genre: "",
    tracks: "",
  });

  const [sending, setSending] = useState(false);

  const validate = () => {
    let tempErrors = { title: "", author: "", genre: "", tracks: "" };
    if (!title) tempErrors.title = "Title is required";
    if (!artist) tempErrors.author = "Artist is required";
    if (!genre) tempErrors.genre = "Genre is required";
    if (tracksNumber < 1)
      tempErrors.tracks = "Please specify a positive number";
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSending(true);
      onSubmit({ artist, album: title, genre, tracksNumber }, fetchDetails);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Box sx={{ margin: "16px 0" }}>
        <TextField
          required
          fullWidth
          id="title"
          label="Title"
          name="title"
          autoComplete="title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
        />
      </Box>
      <Box sx={{ margin: "16px 0" }}>
        <TextField
          required
          fullWidth
          id="artist"
          label="Artist"
          name="artist"
          autoComplete="artist"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          error={!!errors.author}
          helperText={errors.author}
        />
      </Box>
      <Box sx={{ margin: "16px 0", display: "flex" }}>
        <Autocomplete
          fullWidth
          value={genre}
          onChange={(event: any, newValue: string | null) => {
            setGenre(newValue ? capitalizeFirstLetter(newValue) : "");
          }}
          options={musicGenres}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label="Genre"
              error={!!errors.genre}
              helperText={errors.genre}
            />
          )}
          sx={{ marginRight: 2 }}
        />
        <TextField
          required
          type="number"
          id="tracks"
          label="Tracks number"
          name="tracks"
          value={tracksNumber}
          onChange={(e) => setTracksNumber(Number(e.target.value))}
          error={!!errors.tracks}
          helperText={errors.tracks}
        />
      </Box>
      <Box sx={{ margin: "16px 0" }}>
        <FormControlLabel
          control={
            <Switch
              checked={fetchDetails}
              onChange={() => setFetchDetails(!fetchDetails)}
            />
          }
          label="Fetch additional info."
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          startIcon={
            sending ? (
              <CircularProgress size={20} sx={{ color: "inherit" }} />
            ) : undefined
          }
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default CdForm;
