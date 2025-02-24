import {
  Button,
  Divider,
  ListItemIcon,
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
  const { selectedPlayer, setSelectedPlayer, playerDefinitions } = useContext(
    DataRepositoryContext
  );
  const { editPlayerDefinitionFormInstance, openEditPlayerDefinitionForm } =
    useEditPlayerDefinitionForm();
  return (
    <>
      {path === "/" && (
        <>
          <Select
            id="player-select"
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (
                selectedValue === 1 ||
                selectedValue === 2 ||
                selectedValue === 3
              ) {
                setSelectedPlayer(selectedValue);
              } else if (playerDefinitions && playerDefinitions.length > 0) {
                openEditPlayerDefinitionForm(playerDefinitions);
              }
            }}
            value={selectedPlayer !== null ? selectedPlayer : ""}
            variant="standard"
            sx={{ fontSize: "1.2rem" }}
            disableUnderline
          >
            <MenuItem value={1} sx={{ display: "flex" }}>
              <ListItemText primary="Player 1" />
            </MenuItem>
            <MenuItem value={2}>
              <ListItemText primary="Player 2" />
            </MenuItem>
            <MenuItem value={3}>
              <ListItemText primary="Player 3" />
            </MenuItem>
            {playerDefinitions && playerDefinitions.length > 0 && <Divider />}
            {playerDefinitions && playerDefinitions.length > 0 && (
              <MenuItem value={0}>
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
