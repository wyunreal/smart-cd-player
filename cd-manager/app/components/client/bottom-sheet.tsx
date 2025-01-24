import useResizeObserver from "@/app/hooks/use-resize-observer";
import { alpha, Box, useTheme } from "@mui/material";

const MIN_AVAILABLE_HEIGHT = 96;

const BottomSheet = () => {
  const theme = useTheme();
  const { height, resizeRef } = useResizeObserver();
  return (
    <Box
      sx={{
        display: "flex",
        visibility: height < MIN_AVAILABLE_HEIGHT ? "hidden" : "visible",
        flex: 1,
        flexGrow: 2000,
        borderLeft: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
        borderRight: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
        borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.2)}`,
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
        background: `linear-gradient(0deg, ${theme.palette.section.background} 0%, ${theme.palette.background.paper} 100%)`,
      }}
      ref={resizeRef}
    ></Box>
  );
};

export default BottomSheet;
