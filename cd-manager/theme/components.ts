import { BorderRight } from "@mui/icons-material";
import { Theme } from "@mui/material";

const getComponentsOverrides = (theme: Theme) => {
  return {
    ...theme,
    components: {
      MuiTypography: {
        styleOverrides: {
          root: {
            "@-moz-document url-prefix()": {
              marginTop: "2px",
              marginBottom: "-2px",
            },
          },
        },
      },
      MuiStepIcon: {
        styleOverrides: {
          root: {
            "@-moz-document url-prefix()": {
              marginTop: "-2px",
              marginBottom: "2px",
            },
          },
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          root: {
            "@-moz-document url-prefix()": {
              marginTop: "-1px",
              marginBottom: "1px",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "4px",
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          rounded: {
            borderRadius: "8px",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            alignItems: "flex-start",
            backgroundColor: "inherit",
            "& .MuiListItemAvatar-root": {
              minWidth: "48px",
            },
            "&.Mui-selected": {
              "&:hover": {
                [theme.breakpoints.down("md")]: {
                  backgroundColor: "inherit",
                },
              },
            },
            "&:hover": {
              [theme.breakpoints.down("md")]: {
                backgroundColor: "inherit",
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            "&.MuiChip-deletable .MuiChip-deleteIcon": {
              color: "inherit",
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: 0,
            margin: 0,
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            alignItems: "center",
            color: "inherit",
            "&.MuiListItem-root .MuiListItemIcon-root": {
              minWidth: "34px",
            },
            "&.MuiListItem-root .MuiListItemAvatar-root": {
              marginTop: "auto",
              marginBottom: "auto",
              marginLeft: 0,
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            "& .MuiDataGrid-filler": {
              "--rowBorderColor": "transparent !important",
            },
          },
        },
      },
    },
  };
};

export default getComponentsOverrides;
