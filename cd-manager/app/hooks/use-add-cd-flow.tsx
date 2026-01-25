import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { AddCdData } from "../forms/add-cd/types";
import SearchCdForm from "../forms/add-cd/search-cd";
import CdArtForm from "../forms/add-cd/cd-art";
import { validate as validateCdSelection } from "../forms/add-cd/search-cd";
import ArtistArtForm from "../forms/add-cd/artist-art";
import { DataRepositoryContext } from "../providers/data-repository";
import { useCdSelection } from "../providers/cd-selection-context";
import { Cd } from "@/api/types";
import AddCdResult from "../forms/add-cd/result";

const useAddCdFlow = () => {
  const [isAddCdFlowOpen, setIsAddCdFlowOpen] = useState(false);
  const { refreshCds } = useContext(DataRepositoryContext);
  const { selectCdById } = useCdSelection();
  const closeDialog = () => setIsAddCdFlowOpen(false);
  const [createdCdId, setCreatedCdId] = useState<number | null>(null);
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
        <Flow<AddCdData, Cd | null>
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
          ResultScreen={AddCdResult}
          initialData={{ barCode: "", cd: undefined }}
          operationName="Add CD to collection"
          closeActionName="Close"
          onDataSubmission={async (data) => {
            if (!data.cd) {
              return null;
            }
            try {
              const response = await fetch("/api/cds", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(data.cd),
              });
              if (response.ok) {
                const result = await response.json();
                if (result.id !== undefined) {
                  setCreatedCdId(result.id);
                  return {
                    ...data.cd,
                    id: result.id,
                  };
                }
                return null;
              }
              return null;
            } catch (error) {
              console.error("Error adding CD:", error);
              return null;
            }
          }}
          onResultReception={(result) => {
            if (result !== null) {
              setCreatedCdId(result.id);
            }
          }}
          onClose={() => {
            closeDialog();
            if (createdCdId !== null) {
              refreshCds();
              setTimeout(() => {
                selectCdById(createdCdId);
              }, 100);
            }
          }}
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdFlow;
