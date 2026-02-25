import {
  Button,
  Divider,
  ListItemText,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";

import useEditPlayerDefinitionForm from "@/app/hooks/use-edit-player-definition-form";
import useAddCdFlow from "@/app/hooks/use-add-cd-flow";
import { ROUTES } from "@/app/util/routes";

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
  } = useContext(DataRepositoryContext);
  const { editPlayerDefinitionFormInstance, openEditPlayerDefinitionForm } =
    useEditPlayerDefinitionForm();

  const playerIsEmpty = (playerIndex: number) =>
    playerContent[playerIndex].length === 1 &&
    playerContent[playerIndex][0].cd === null;

  return (
    <>
      {path === ROUTES.PLAYER && (
        <>
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
