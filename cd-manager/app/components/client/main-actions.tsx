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
import useAddCdForm from "@/app/hooks/use-add-cd-form";
import { useContext } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { SettingsIcon } from "@/app/icons";
import useEditPlayerDefinitionForm from "@/app/hooks/use-edit-player-definition-form";

const MainActions = () => {
  const path = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { openAddCdForm, addCdFormInstance } = useAddCdForm();
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
      {path === "/" && (
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
                  )
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
      {path === "/collection" && (
        <>
          <Button
            variant={isMobile ? "outlined" : "contained"}
            onClick={openAddCdForm}
          >
            Add CD
          </Button>
          {addCdFormInstance}
        </>
      )}
      {path === "/groups" && (
        <Button variant={isMobile ? "outlined" : "contained"}>
          Create group
        </Button>
      )}
    </>
  );
};

export default MainActions;
