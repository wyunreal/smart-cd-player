"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import musicGenres from "./genres";
import { CdInputData } from "@/api/types";

const CdForm = ({
  onSubmit,
}: {
  onSubmit: (data: CdInputData) => Promise<void>;
}) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [tracksNumber, setTracksNumber] = useState(0);
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
      onSubmit({ artist, album: title, genre, tracksNumber });
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
            setGenre(newValue || "");
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
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          startIcon={sending ? <CircularProgress size={24} /> : undefined}
        >
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default CdForm;
