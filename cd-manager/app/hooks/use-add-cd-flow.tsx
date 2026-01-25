import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { AddCdData } from "../forms/add-cd/types";
import SearchCdForm from "../forms/add-cd/search-cd";
import CdArtForm from "../forms/add-cd/cd-art";
import { validate as validateCdSelection } from "../forms/add-cd/search-cd";
import ArtistArtForm from "../forms/add-cd/artist-art";
import { DataRepositoryContext } from "../providers/data-repository";

const useAddCdFlow = () => {
  const [isAddCdFlowOpen, setIsAddCdFlowOpen] = useState(false);
  const { refreshCds } = useContext(DataRepositoryContext);
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
              validate: validateCdSelection,
            },
            {
              title: "Select CD picture",
              content: CdArtForm,
              validate: () => null,
            },
            {
              title: "Select artist picture",
              content: ArtistArtForm,
              validate: () => null,
            },
          ]}
          ResultScreen={({ result }) =>
            result ? <>CD added</> : <>CD not added</>
          }
          initialData={{ barCode: "", cd: undefined }}
          operationName="Add CD to collection"
          closeActionName="Close"
          onDataSubmission={async (data) => {
            if (!data.cd) {
              return false;
            }
            try {
              const response = await fetch("/api/cds", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data.cd),
              });
              return response.ok;
            } catch (error) {
              console.error("Error adding CD:", error);
              return false;
            }
          }}
          onResultReception={(result) => {
            if (result) {
              refreshCds();
            }
          }}
          onClose={closeDialog}
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdFlow;
