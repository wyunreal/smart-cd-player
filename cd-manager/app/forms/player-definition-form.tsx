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
  Typography,
  Stack,
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
  // Derived global values (using the first definition as source of truth)
  const globalIrCommandsUrl = definitions[0]?.irCommandsUrl || "";
  const globalIrSendCommandBaseUrl = definitions[0]?.irSendCommandUrl || "";

  const handleGlobalIrCommandsUrlChange = (value: string) => {
    const newDefinitions = definitions.map((def) => ({
      ...def,
      irCommandsUrl: value,
    }));
    setDefinitions(newDefinitions);
  };

  const handleGlobalIrSendCommandBaseUrlChange = (value: string) => {
    const newDefinitions = definitions.map((def) => ({
      ...def,
      irSendCommandUrl: value,
    }));
    setDefinitions(newDefinitions);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography sx={{ mb: 2 }}>IR remote configuration</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Configured commands URL"
          value={globalIrCommandsUrl}
          onChange={(e) => handleGlobalIrCommandsUrlChange(e.target.value)}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Send command base URL"
          value={globalIrSendCommandBaseUrl}
          onChange={(e) =>
            handleGlobalIrSendCommandBaseUrlChange(e.target.value)
          }
        />
      </Box>

      {definitions.map((definition, index) => (
        <Box key={index} sx={{ marginBottom: 1, marginTop: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={definition.active}
                onChange={(event) => {
                  const newDefinitions = [...definitions];
                  newDefinitions[index] = {
                    ...newDefinitions[index],
                    active: !!event.target.checked,
                  };
                  setDefinitions(newDefinitions);
                }}
              />
            }
            label={`Player ${index + 1}`}
            labelPlacement="start"
            sx={{ margin: 0 }}
          />
          <Box sx={{ marginTop: 1, marginBottom: 2 }}>
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id={`player${index + 1}-capacity-label`}>
                  Capacity
                </InputLabel>
                <Select
                  labelId={`player${index + 1}-capacity-label`}
                  id={`player${index + 1}-capacity`}
                  value={(definition.capacity || VALID_CAPACITY[0]).toString()}
                  label="Capacity"
                  onChange={(event: SelectChangeEvent) => {
                    const newDefinitions = [...definitions];
                    newDefinitions[index] = {
                      ...newDefinitions[index],
                      capacity: Number(event.target.value),
                    };
                    setDefinitions(newDefinitions);
                  }}
                >
                  {VALID_CAPACITY.map((capacity, capIndex) => (
                    <MenuItem key={capIndex} value={capacity.toString()}>
                      {capacity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Device Name"
                value={definition.irDeviceName || ""}
                onChange={(event) => {
                  const newDefinitions = [...definitions];
                  newDefinitions[index] = {
                    ...newDefinitions[index],
                    irDeviceName: event.target.value,
                  };
                  setDefinitions(newDefinitions);
                }}
              />
            </Stack>
            <Box sx={{ marginTop: 1, marginBottom: 2 }}>
              <Typography fontSize="small">{`Send command URL: ${definition.irSendCommandUrl ? `${definition.irSendCommandUrl}${definition.irDeviceName ? `?device=${definition.irDeviceName}` : ""}` : "..."}`}</Typography>
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
