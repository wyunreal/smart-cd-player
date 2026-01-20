import CdForm from "@/app/forms/cd-form";
import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { CdInputData } from "@/api/types";
import { editCd } from "@/api/cd-collection";

const useEditCdForm = () => {
  const [isEditCdDialogOpen, setIsEditCdDialogOpen] = useState(false);
  const [cd, setCd] = useState<CdInputData | null>(null);
  const [cdId, setCdId] = useState<number>(0);
  const { refreshCds } = useContext(DataRepositoryContext);
  return {
    openEditCdForm: (cd: CdInputData, cdId: number) => {
      setCd(cd);
      setCdId(cdId);
      setIsEditCdDialogOpen(true);
    },
    editCdFormInstance: cd && (
      <ResponsiveDialog
        title={`Edit Cd: ${cd.album}`}
        isOpen={isEditCdDialogOpen}
        onClose={() => setIsEditCdDialogOpen(false)}
      >
        <CdForm
          cd={cd}
          onSubmit={(data) =>
            new Promise<void>((resolve) => {
              editCd(data, cdId).then(() => {
                setIsEditCdDialogOpen(false);
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

export default useEditCdForm;
