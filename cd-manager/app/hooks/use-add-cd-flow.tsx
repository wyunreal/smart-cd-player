import { useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { Cd } from "@/api/types";
import { AddCdData } from "../forms/add-cd/types";
import SearchCdForm from "../forms/add-cd/search-cd";
import CdPreviewForm from "../forms/add-cd/cd-preview";
import CdArtForm from "../forms/add-cd/cd-art";

const useAddCdFlow = () => {
  const [isAddCdFlowOpen, setIsAddCdFlowOpen] = useState(false);
  const [cd, setCd] = useState<Cd | undefined>(undefined);
  const closeDialog = () => setIsAddCdFlowOpen(false);
  return {
    openAddCdFlow: () => {
      setIsAddCdFlowOpen(true);
    },
    addCdFlowInstance: (
      <ResponsiveDialog
        title="Add CD"
        isOpen={isAddCdFlowOpen}
        onClose={closeDialog}
      >
        <Flow<AddCdData, boolean>
          steps={[
            {
              title: "Search CD",
              content: SearchCdForm,
              validate: () => null,
            },
            {
              title: "Preview",
              content: CdPreviewForm,
              validate: () => null,
            },
            {
              title: "Album art",
              content: CdArtForm,
              validate: () => null,
            },
          ]}
          ResultScreen={({ result }) =>
            result ? <>CD added</> : <>CD not added</>
          }
          initialData={{ cd }}
          operationName="Add CD to collection"
          closeActionName="Close"
          onDataSubmission={(data) =>
            new Promise<boolean>((resolve) => {
              console.log(`Adding CD ${data?.cd?.id}`);
              resolve(true);
            })
          }
          onResultReception={(result) => {
            console.log("Result received", result);
          }}
          onClose={closeDialog}
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdFlow;
