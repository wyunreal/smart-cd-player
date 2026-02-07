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
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { PlayerDefinition } from "@/api/types";
import { DEFINITIONS_COUNT, VALID_CAPACITY } from "@/api/constants";

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
    })),
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
      {definitions.map((definition, index) => (
        <Box key={index} sx={{ marginBottom: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={definition.active}
                onChange={(event) => {
                  definitions[index].active = !!event.target.checked;
                  setDefinitions([...definitions]);
                }}
              />
            }
            label={`Player ${index + 1}`}
            labelPlacement="start"
            sx={{ margin: 0 }}
          />
          <Box sx={{ marginTop: 1, marginBottom: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="player1-capacity-label">Capacity</InputLabel>
              <Select
                labelId="player1-capacity-label"
                id="player1-capacity"
                value={(definition.capacity || VALID_CAPACITY[0]).toString()}
                label="Capacity"
                onChange={(event: SelectChangeEvent) => {
                  definitions[index].capacity = Number(event.target.value);
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
            <Box sx={{ marginTop: 1, marginBottom: 2 }}>
              <TextField
                fullWidth
                label="Available IR Commands URL"
                value={definition.irCommandsUrl || ""}
                onChange={(event) => {
                  definitions[index].irCommandsUrl = event.target.value;
                  setDefinitions([...definitions]);
                }}
              />
            </Box>
            <Box sx={{ marginTop: 1, marginBottom: 2 }}>
              <TextField
                fullWidth
                label="Send IR Command URL"
                value={definition.irSendCommandUrl || ""}
                onChange={(event) => {
                  definitions[index].irSendCommandUrl = event.target.value;
                  setDefinitions([...definitions]);
                }}
              />
            </Box>
          </Box>
        </Box>
      ))}

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
