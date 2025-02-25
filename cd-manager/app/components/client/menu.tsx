import * as React from "react";
import { default as MuiMenu } from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Button, IconButton, ListItemIcon, ListItemText } from "@mui/material";
import useTheme from "@mui/material/styles/useTheme";

type BaseAction = {
  type: "action";
  caption: string;
  icon?: React.ReactNode;
};

export type HandlerAction = BaseAction & {
  handler: () => void;
};

type BaseMenuOption = HandlerAction;
type MenuOption = BaseMenuOption & {
  alertIcon?: React.ReactNode;
};

type MenuDivider = {
  type: "divider";
};

type MenuProps = {
  icon: React.ReactNode;
  alert?: boolean;
  caption?: string;
  options: readonly (MenuOption | MenuDivider)[];
  menuId: string;
};

const Menu = ({ menuId, icon, alert, caption, options }: MenuProps) => {
  const theme = useTheme();
  const [anchorElement, setAnchorElement] = React.useState<null | HTMLElement>(
    null
  );
  const open = !!anchorElement;
  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorElement(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorElement(null);
  };
  const insetItems = !!options.find(
    (option) => option.type === "action" && !!option.icon
  );
  return (
    <>
      {caption ? (
        <Button
          variant="text"
          size="small"
          onClick={handleOpenMenu}
          endIcon={icon}
          {...(alert ? { color: "warning" } : {})}
        >
          {caption}
        </Button>
      ) : (
        <IconButton
          {...(alert ? { color: "warning" } : {})}
          onClick={handleOpenMenu}
        >
          {icon}
        </IconButton>
      )}
      <MuiMenu
        id={menuId}
        anchorEl={anchorElement}
        open={open}
        onClose={handleCloseMenu}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {options.map((option, index) => {
          if (option.type === "divider") {
            return <MenuItem key={index} divider />;
          }

          const { caption, icon, alertIcon, handler } = option;

          return (
            <MenuItem
              key={index}
              onClick={() => {
                handleCloseMenu();
                setTimeout(handler, 100);
              }}
            >
              {(icon || alertIcon) && (
                <ListItemIcon
                  sx={
                    alertIcon
                      ? {
                          color: theme.palette.warning.main,
                        }
                      : {}
                  }
                >
                  {icon || alertIcon}
                </ListItemIcon>
              )}
              <ListItemText inset={insetItems && !icon}>{caption}</ListItemText>
            </MenuItem>
          );
        })}
      </MuiMenu>
    </>
  );
};

export default Menu;
