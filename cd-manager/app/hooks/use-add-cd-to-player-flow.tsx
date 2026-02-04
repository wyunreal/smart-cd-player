import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { Cd } from "@/api/types";
import { AddCdToPlayerData } from "../forms/add-cd-to-player/types";
import SlotForm from "../forms/add-cd-to-player/slot-form";
import { addCdToPlayer } from "@/api/cd-player-content";
import { DataRepositoryContext } from "../providers/data-repository";

const useAddCdToPlayerFlow = (
  props?:
    | {
        onAfterFlowExecuted?: () => void;
      }
    | undefined,
) => {
  const { refreshPlayerContent } = useContext(DataRepositoryContext);
  const [isAddCdToPlayerFlowOpen, setIsAddCdToPlayerFlowOpen] = useState(false);
  const [cd, setCd] = useState<Cd | undefined>();
  const closeDialog = () => setIsAddCdToPlayerFlowOpen(false);
  return {
    openAddCdToPlayerFlow: ({ cd }: { cd?: Cd }) => {
      setCd(cd);
      setIsAddCdToPlayerFlowOpen(true);
    },
    addCdToPlayerFlowInstance: (
      <ResponsiveDialog
        title="Add CD to player"
        isOpen={isAddCdToPlayerFlowOpen}
        onClose={closeDialog}
      >
        <Flow<AddCdToPlayerData, AddCdToPlayerData | null>
          steps={[
            {
              title: "Select slot",
              content: SlotForm,
              validate: () => null,
            },
          ]}
          ResultScreen={({ result }) =>
            result ? <>CD added to player</> : <>CD not added to player</>
          }
          initialData={{ cd }}
          operationName="Add CD"
          closeActionName="Confirm"
          onDataSubmission={async (data) => {
            try {
              await addCdToPlayer(data.player ?? 1, data.cd!, data.slot ?? 1);
              return data;
            } catch (error) {
              return null;
            }
          }}
          onResultReception={(data) => {
            if (data) {
              refreshPlayerContent();
            }
            if (props?.onAfterFlowExecuted) {
              props.onAfterFlowExecuted();
            }
          }}
          onClose={closeDialog}
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdToPlayerFlow;
