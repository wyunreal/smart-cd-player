"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { SearchOutlinedIcon } from "@/app/icons";
import { VirtualSlot } from "@/lib/virtual-slots";

type SearchResult = {
  slot: VirtualSlot;
  matchType: "album" | "track";
  trackName?: string;
};

const SearchSlotForm = ({
  slots,
  onSlotSelect,
  isOpen,
}: {
  slots: VirtualSlot[];
  onSlotSelect: (virtualNumber: number) => void;
  isOpen: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];

    const matches: SearchResult[] = [];

    for (const slot of slots) {
      if (!slot.cd) continue;

      const artistMatch = slot.cd.artist.toLowerCase().includes(term);
      const titleMatch = slot.cd.title.toLowerCase().includes(term);

      if (artistMatch || titleMatch) {
        matches.push({ slot, matchType: "album" });
      } else {
        for (const track of slot.cd.tracks) {
          if (track.title.toLowerCase().includes(term)) {
            matches.push({
              slot,
              matchType: "track",
              trackName: track.title,
            });
          }
        }
      }
    }

    return matches;
  }, [searchTerm, slots]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: "calc(100dvh - 64px)", sm: "auto" },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, sm: 0 },
          pt: { xs: 1, sm: 0 },
          pb: 1,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search by artist, album, or track..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          maxHeight: { sm: "60vh" },
        }}
      >
        <List>
          {results.map((result, index) => (
            <React.Fragment
              key={`${result.slot.number}-${result.trackName || "album"}-${index}`}
            >
              <ListItemButton
                onClick={() => onSlotSelect(result.slot.number)}
                sx={{
                  px: 1,
                  pl: { xs: "16px", sm: 1 },
                  pr: "16px",
                  alignItems: "center",
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    variant="rounded"
                    src={
                      result.slot.cd?.art?.album?.uri150 ||
                      "/cd-placeholder-small.png"
                    }
                    sx={{ width: 40, height: 40 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    result.matchType === "album"
                      ? result.slot.cd?.artist
                      : result.trackName
                  }
                  secondary={
                    result.matchType === "album"
                      ? (result.slot.cd?.diskAmount || 1) > 1
                        ? `${result.slot.cd?.title}, Disc ${result.slot.cd?.diskNumber}`
                        : result.slot.cd?.title
                      : result.slot.cd?.title
                  }
                />
                <Box sx={{ ml: 1, textAlign: "right" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {`Slot ${result.slot.number}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {`Player ${result.slot.playerRemoteIndex} · slot ${result.slot.slot}`}
                  </Typography>
                </Box>
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))}
          {searchTerm.trim().length < 2 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mt: 4,
              }}
            >
              <SearchOutlinedIcon color="disabled" />
              <Typography color="text.secondary">
                Start typing to search
              </Typography>
            </Box>
          )}
          {searchTerm.trim().length >= 2 && results.length === 0 && (
            <Typography
              sx={{ textAlign: "center", mt: 2 }}
              color="text.secondary"
            >
              No results found
            </Typography>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default SearchSlotForm;
