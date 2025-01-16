import { Button, useMediaQuery, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import useAddCdForm from "@/app/hooks/use-add-cd-form";

const MainActions = () => {
  const path = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { openAddCdForm, addCdFormInstance } = useAddCdForm();
  return (
    <>
      {path === "/" && (
        <Button
          variant={isMobile ? "outlined" : "contained"}
          onClick={openAddCdForm}
        >
          Add CD
        </Button>
      )}
      {path === "/groups" && (
        <Button variant={isMobile ? "outlined" : "contained"}>
          Create group
        </Button>
      )}
      {addCdFormInstance}
    </>
  );
};

export default MainActions;
