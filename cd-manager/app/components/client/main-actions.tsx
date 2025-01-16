import { Button, useMediaQuery, useTheme } from "@mui/material";
import { usePathname } from "next/navigation";
import ResponsiveDialog from "./dialog/responsive-dialog";
import CdForm from "@/app/forms/cd-form";
import { useState } from "react";
import { addCd } from "@/api/cd-collection";

const MainActions = () => {
  const path = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isAddCdDialogOpen, setIsAddCdDialogOpen] = useState(false);
  return (
    <>
      {path === "/" && (
        <Button
          variant={isMobile ? "outlined" : "contained"}
          onClick={() => setIsAddCdDialogOpen(true)}
        >
          Add CD
        </Button>
      )}
      {path === "/groups" && (
        <Button variant={isMobile ? "outlined" : "contained"}>
          Create group
        </Button>
      )}
      <ResponsiveDialog
        title="Add CD to collection"
        isOpen={isAddCdDialogOpen}
        onClose={() => setIsAddCdDialogOpen(false)}
      >
        <CdForm
          onSubmit={(data) =>
            new Promise<void>((resolve) => {
              addCd(data).then(() => {
                setIsAddCdDialogOpen(false);
                resolve();
              });
            })
          }
        />
      </ResponsiveDialog>
    </>
  );
};

export default MainActions;
