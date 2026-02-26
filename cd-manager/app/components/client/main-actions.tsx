import {
  Box,
  Button,
  Divider,
  ListItemText,
  MenuItem,
  Select,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";

import useEditPlayerDefinitionForm from "@/app/hooks/use-edit-player-definition-form";
import useAddCdFlow from "@/app/hooks/use-add-cd-flow";
import { ROUTES } from "@/app/util/routes";
import PlayerControlButtons from "./player-control-buttons";

const MainActions = () => {
  const path = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { openAddCdFlow, addCdFlowInstance } = useAddCdFlow();
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [centerLeft, setCenterLeft] = useState<number | null>(null);

  useEffect(() => {
    if (path !== ROUTES.PLAYER || isMobile) return;

    const updatePosition = () => {
      const main = document.querySelector("main");
      const toolbar = buttonsRef.current?.closest(".MuiToolbar-root");
      if (main && toolbar) {
        const mainRect = main.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        setCenterLeft(
          mainRect.left + mainRect.width / 2 - toolbarRect.left,
        );
      }
    };

    updatePosition();

    const main = document.querySelector("main");
    if (main) {
      const observer = new ResizeObserver(updatePosition);
      observer.observe(main);
      return () => observer.disconnect();
    }
  }, [path, isMobile]);
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
          {!isMobile && (
            <Box
              ref={buttonsRef}
              sx={{
                position: "absolute",
                left: centerLeft !== null ? `${centerLeft}px` : "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <PlayerControlButtons />
            </Box>
          )}
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
