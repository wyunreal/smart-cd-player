"use client";

import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";

const CdForm = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [errors, setErrors] = useState({ title: "", author: "" });

  const validate = () => {
    let tempErrors = { title: "", author: "" };
    if (!title) tempErrors.title = "Title is required";
    if (!author) tempErrors.author = "Author is required";
    setErrors(tempErrors);
    return Object.values(tempErrors).every((x) => x === "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log({ title, author });
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
          id="author"
          label="Author"
          name="author"
          autoComplete="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          error={!!errors.author}
          helperText={errors.author}
        />
      </Box>
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default CdForm;
