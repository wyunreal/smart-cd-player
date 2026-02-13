import { StepProps } from "@/app/components/client/flow";
import { AddCdToPlayerData } from "./types";
import CdRow from "@/app/components/client/cd-row";
import { useContext, useEffect, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import {
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const SlotForm = ({ data, onDataChanged }: StepProps<AddCdToPlayerData>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { playerContent, playerDefinitions, selectedPlayer } = useContext(
    DataRepositoryContext,
  );
  const [selectedplayerRemote, setSelectedPlayerRemote] = useState<number>(
    data.player !== undefined
      ? data.player
      : selectedPlayer !== null
        ? selectedPlayer
        : 1,
  );
  const [slot, setSlot] = useState<number>(data.slot ?? 1);

  const getSlotCount = (playerRemote: number) => {
    const selectedPlayerDef = playerDefinitions?.find(
      (pd) => pd.remoteIndex === playerRemote,
    );
    return selectedPlayerDef?.capacity ?? 0;
  };

  const currentPlayerContent = playerContent[selectedplayerRemote - 1];
  const cdInSelectedSlot = currentPlayerContent?.find(
    (slotContent) => slotContent.slot === slot,
  )?.cd;

  useEffect(() => {
    if (data.player !== selectedplayerRemote || data.slot !== slot) {
      onDataChanged({
        ...data,
        player: selectedplayerRemote,
        slot,
      });
    }
  }, [data, onDataChanged, selectedplayerRemote, slot]);

  return (
    data.cd && (
      <Stack spacing={2}>
        <Typography>You are about to insert the CD:</Typography>
        <CdRow cd={data.cd} />
        <Typography sx={{ pt: 2 }}>Select the player slot:</Typography>
        <Stack direction={isMobile ? "column" : "row"} spacing={2}>
          <Select
            fullWidth
            label="Select player"
            value={selectedplayerRemote}
            onChange={(e) => {
              setSelectedPlayerRemote(Number(e.target.value));
              setSlot((currentSlot) => {
                const slotCount = getSlotCount(Number(e.target.value));
                return currentSlot <= slotCount && currentSlot >= 1
                  ? currentSlot
                  : 1;
              });
            }}
          >
            {playerDefinitions?.map((player) => (
              <MenuItem key={player.remoteIndex} value={player.remoteIndex}>
                {`Player ${player.remoteIndex}, ${player.capacity} slots, ${player.active ? "(Active)" : ""}`}
              </MenuItem>
            ))}
          </Select>
          <TextField
            type="number"
            label="Slot number"
            slotProps={{
              htmlInput: {
                min: 1,
                max: getSlotCount(selectedplayerRemote),
              },
            }}
            value={slot}
            onChange={(e) => {
              const value = e.target.value === "" ? "" : Number(e.target.value);
              if (value === "") {
                setSlot(0);
              } else if (
                value >= 1 &&
                value <= getSlotCount(selectedplayerRemote)
              ) {
                setSlot(value);
              }
            }}
            sx={{ minWidth: 120 }}
          />
        </Stack>
        {cdInSelectedSlot && (
          <Stack spacing={2}>
            <Typography>{`Slot ${slot} is occupied, please remove the following CD first:`}</Typography>
            <CdRow cd={cdInSelectedSlot} />
          </Stack>
        )}
      </Stack>
    )
  );
};

export default SlotForm;
