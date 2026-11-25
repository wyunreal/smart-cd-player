import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { DataRepositoryContext } from "@/app/providers/data-repository";

import useEditPlayerDefinitionForm from "@/app/hooks/use-edit-player-definition-form";
import useAddCdFlow from "@/app/hooks/use-add-cd-flow";
import { ROUTES } from "@/app/util/routes";
import PlayerControlButtons from "./player-control-buttons";
import Menu from "./menu";
import { MoreVertIcon, SettingsOutlinedIcon } from "@/app/icons";

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

  const { playerDefinitions } = useContext(DataRepositoryContext);
  const { editPlayerDefinitionFormInstance, openEditPlayerDefinitionForm } =
    useEditPlayerDefinitionForm();

  return (
    <>
      {path === ROUTES.PLAYER && (
        <>
          <Box
            ref={buttonsRef}
            sx={{
              position: "absolute",
              left: centerLeft !== null ? `${centerLeft}px` : "50%",
              transform: "translateX(-50%)",
              display: { xs: "none", sm: "flex" },
              visibility: centerLeft !== null ? "visible" : "hidden",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <PlayerControlButtons />
          </Box>
          {playerDefinitions && playerDefinitions.length > 0 && (
            <Menu
              menuId="player-actions"
              icon={<MoreVertIcon />}
              options={[
                {
                  type: "action",
                  icon: <SettingsOutlinedIcon />,
                  caption: "Configure players",
                  handler: () => openEditPlayerDefinitionForm(playerDefinitions),
                },
              ]}
            />
          )}
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
