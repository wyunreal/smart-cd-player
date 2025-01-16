import CdForm from "@/app/forms/cd-form";
import { useState } from "react";
import { addCd } from "@/api/cd-collection";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";

const useAddCdForm = () => {
  const [isAddCdDialogOpen, setIsAddCdDialogOpen] = useState(false);

  return {
    openAddCdForm: () => setIsAddCdDialogOpen(true),
    addCdFormInstance: (
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
    ),
  };
};

export default useAddCdForm;
