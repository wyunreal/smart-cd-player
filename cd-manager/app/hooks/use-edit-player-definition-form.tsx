import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import { DataRepositoryContext } from "@/app/providers/data-repository";
import { PlayerDefinition } from "@/api/types";
import PlayerDefinitionForm from "../forms/player-definition-form";
import { savePlayerDefinitions } from "@/api/cd-player-definitions";

const useEditPlayerDefinitionForm = () => {
  const [
    isEditPlayerDefinitionDialogOpen,
    setIsEditPlayerDefinitionDialogOpen,
  ] = useState(false);
  const [definitions, setDefinitions] = useState<PlayerDefinition[] | null>(
    null
  );
  const { refreshPlayerDefinitions } = useContext(DataRepositoryContext);
  return {
    openEditPlayerDefinitionForm: (playerDefinition: PlayerDefinition[]) => {
      setDefinitions(playerDefinition);
      setIsEditPlayerDefinitionDialogOpen(true);
    },
    editPlayerDefinitionFormInstance: definitions && (
      <ResponsiveDialog
        title={`Edit players definitions`}
        isOpen={isEditPlayerDefinitionDialogOpen}
        onClose={() => setIsEditPlayerDefinitionDialogOpen(false)}
      >
        <PlayerDefinitionForm
          playerDefinitions={definitions}
          onSubmit={(definitions) =>
            new Promise<void>((resolve) => {
              savePlayerDefinitions(definitions).then(() => {
                setIsEditPlayerDefinitionDialogOpen(false);
                refreshPlayerDefinitions();
                resolve();
              });
            })
          }
        />
      </ResponsiveDialog>
    ),
  };
};

export default useEditPlayerDefinitionForm;
