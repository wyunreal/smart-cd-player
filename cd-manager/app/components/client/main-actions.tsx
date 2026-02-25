import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useCallback, useContext } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerCommand } from "@/api/types";

import useEditPlayerDefinitionForm from "@/app/hooks/use-edit-player-definition-form";
import useAddCdFlow from "@/app/hooks/use-add-cd-flow";
import { ROUTES } from "@/app/util/routes";
import {
  SkipPreviousIcon,
  PlayArrowIcon,
  PauseIcon,
  SkipNextIcon,
  PowerSettingsNewIcon,
} from "@/app/icons";

const MainActions = () => {
  const path = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { openAddCdFlow, addCdFlowInstance } = useAddCdFlow();
  const {
    selectedPlayer,
    setSelectedPlayer,
    playerDefinitions,
    playerContent,
    irRemoteClients,
  } = useContext(DataRepositoryContext);
  const { editPlayerDefinitionFormInstance, openEditPlayerDefinitionForm } =
    useEditPlayerDefinitionForm();

  const playerIsEmpty = (playerIndex: number) =>
    playerContent[playerIndex].length === 1 &&
    playerContent[playerIndex][0].cd === null;

  const currentRemoteClient =
    selectedPlayer !== null ? irRemoteClients[selectedPlayer - 1] : null;

  const sendCommand = useCallback(
    async (command: PlayerCommand) => {
      if (!currentRemoteClient) return;
      try {
        await currentRemoteClient.sendOrder([{ command, delayAfterMs: 0 }]);
      } catch (e) {
        console.error("Failed to send command", e);
      }
    },
    [currentRemoteClient],
  );

  const isCommandSupported = useCallback(
    (command: PlayerCommand) => {
      return currentRemoteClient?.isCommandSupported(command) ?? false;
    },
    [currentRemoteClient],
  );

  return (
    <>
      {path === ROUTES.PLAYER && (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: 1 }}>
            <IconButton
              size="small"
              onClick={() => sendCommand(PlayerCommand.PreviousTrack)}
              disabled={!isCommandSupported(PlayerCommand.PreviousTrack)}
            >
              <SkipPreviousIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => sendCommand(PlayerCommand.Play)}
              disabled={!isCommandSupported(PlayerCommand.Play)}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => sendCommand(PlayerCommand.Pause)}
              disabled={!isCommandSupported(PlayerCommand.Pause)}
            >
              <PauseIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => sendCommand(PlayerCommand.NextTrack)}
              disabled={!isCommandSupported(PlayerCommand.NextTrack)}
            >
              <SkipNextIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => sendCommand(PlayerCommand.PowerSwitch)}
              disabled={!isCommandSupported(PlayerCommand.PowerSwitch)}
            >
              <PowerSettingsNewIcon fontSize="small" />
            </IconButton>
          </Box>
          <Select
            id="player-select"
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (Number(selectedValue) !== 0) {
                setSelectedPlayer(Number(selectedValue));
              } else if (playerDefinitions && playerDefinitions.length > 0) {
                openEditPlayerDefinitionForm(playerDefinitions);
              }
            }}
            value={selectedPlayer !== null ? selectedPlayer : ""}
            variant="standard"
            sx={{ fontSize: "1.2rem" }}
            disableUnderline
          >
            {playerDefinitions &&
              playerDefinitions.map(
                (player, index) =>
                  (player.active || !playerIsEmpty(index)) && (
                    <MenuItem
                      key={`player${index}`}
                      value={index + 1}
                      sx={{ display: "flex" }}
                    >
                      <ListItemText primary={`Player ${index + 1}`} />
                    </MenuItem>
                  ),
              )}
            {playerDefinitions && playerDefinitions.length > 0 && (
              <Divider key="divider" />
            )}
            {playerDefinitions && playerDefinitions.length > 0 && (
              <MenuItem key="configure" value={0}>
                <ListItemText primary="Configure players" />
              </MenuItem>
            )}
          </Select>
          {editPlayerDefinitionFormInstance}
        </>
      )}
      {path === ROUTES.COLLECTION && (
        <>
          <Button
            variant={isMobile ? "outlined" : "contained"}
            onClick={openAddCdFlow}
          >
            Add CD
          </Button>
          {addCdFlowInstance}
        </>
      )}
    </>
  );
};

export default MainActions;
