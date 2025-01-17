import CdForm from "@/app/forms/cd-form";
import { useContext, useState } from "react";
import { addCd } from "@/api/cd-collection";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import { DataRepositoryContext } from "@/providers/data-repository";

const useAddCdForm = () => {
  const [isAddCdDialogOpen, setIsAddCdDialogOpen] = useState(false);
  const { refreshCds } = useContext(DataRepositoryContext);
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
                refreshCds();
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
