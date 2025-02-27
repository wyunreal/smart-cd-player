import { useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { Cd } from "@/api/types";

type AddCdToPlayerData = {
  player?: number;
  slot?: number;
  cd?: Cd;
};

const useAddCdToPlayerFlow = () => {
  const [isAddCdToPlayerFlowOpen, setIsAddCdToPlayerFlowOpen] = useState(false);
  const [cd, setCd] = useState<Cd | undefined>();
  //const {} = useContext(DataRepositoryContext);
  return {
    openAddCdToPlayerFlow: ({ cd }: { cd: Cd }) => {
      setCd(cd);
      setIsAddCdToPlayerFlowOpen(true);
    },
    addCdToPlayerFlowInstance: (
      <ResponsiveDialog
        title="Add CD to player"
        isOpen={isAddCdToPlayerFlowOpen}
        onClose={() => setIsAddCdToPlayerFlowOpen(false)}
      >
        <Flow<AddCdToPlayerData | null, boolean>
          steps={[
            {
              title: "Select slot",
              content: () => <>{`Slot selection for cd ${cd?.id}`}</>,
            },
            {
              title: "Summary",
              content: () => <>Summary</>,
            },
          ]}
          ResultScreen={({ result }) =>
            result ? <>CD added to player</> : <>CD not added to player</>
          }
          initialData={{ cd }}
          onDataSubmitted={(data) =>
            new Promise<boolean>((resolve) => {
              alert(
                `Adding CD ${data?.cd?.id} to slot ${data?.slot} on player ${data?.player}`
              );
              resolve(true);
            })
          }
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdToPlayerFlow;
