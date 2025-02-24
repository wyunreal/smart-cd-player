"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { PlayerDefinition } from "@/api/types";
import { DEFINITIONS_COUNT, VALID_CAPACITY } from "@/api/cd-player-definitions";

const PlayerDefinitionForm = ({
  playerDefinitions,
  onSubmit,
}: {
  playerDefinitions: PlayerDefinition[];
  onSubmit: (data: PlayerDefinition[]) => Promise<void>;
}) => {
  const [definitions, setDefinitions] = useState<PlayerDefinition[]>(
    Array.from({ length: DEFINITIONS_COUNT }, (_, i) => ({
      remoteIndex: i + 1,
      capacity: VALID_CAPACITY[0],
      active: true,
    }))
  );

  useEffect(() => {
    setDefinitions(playerDefinitions);
  }, [playerDefinitions]);

  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    onSubmit(definitions);
  };
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Box sx={{ margin: "16px 0" }}>
        <FormControl fullWidth>
          <InputLabel id="player1-capacity-label">Capacity</InputLabel>
          <Select
            labelId="player1-capacity-label"
            id="player1-capacity"
            value={(definitions[0].capacity || VALID_CAPACITY[0]).toString()}
            label="Capacity"
            onChange={(event: SelectChangeEvent) => {
              definitions[0].capacity = Number(event.target.value);
              setDefinitions([...definitions]);
            }}
          >
            {VALID_CAPACITY.map((capacity, index) => (
              <MenuItem key={index} value={capacity.toString()}>
                {capacity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ margin: "16px 0" }}>
        <FormControl fullWidth>
          <InputLabel id="player2-capacity-label">Capacity</InputLabel>
          <Select
            labelId="player2-capacity-label"
            id="player2-capacity"
            value={(definitions[1].capacity || VALID_CAPACITY[0]).toString()}
            label="Capacity"
            onChange={(event: SelectChangeEvent) => {
              definitions[1].capacity = Number(event.target.value);
              setDefinitions([...definitions]);
            }}
          >
            {VALID_CAPACITY.map((capacity, index) => (
              <MenuItem key={index} value={capacity.toString()}>
                {capacity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ margin: "16px 0" }}>
        <FormControl fullWidth>
          <InputLabel id="player3-capacity-label">Capacity</InputLabel>
          <Select
            labelId="player3-capacity-label"
            id="player2-capacity"
            value={(definitions[2].capacity || VALID_CAPACITY[0]).toString()}
            label="Capacity"
            onChange={(event: SelectChangeEvent) => {
              definitions[2].capacity = Number(event.target.value);
              setDefinitions([...definitions]);
            }}
          >
            {VALID_CAPACITY.map((capacity, index) => (
              <MenuItem key={index} value={capacity.toString()}>
                {capacity}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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

export default PlayerDefinitionForm;
