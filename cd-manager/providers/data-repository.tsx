import useCdCollecitonProviderProps, {
  CdCollectionProps,
} from "@/app/hooks/use-cd-collection-provider-props";
import usePlayerContentProviderProps, {
  PlayerContentProps,
} from "@/app/hooks/use-player-content-provider-props";
import usePlayerDefinitionsProviderProps, {
  PlayerDefinitionsProps,
} from "@/app/hooks/use-player-definitions-provider-props";
import React, { createContext, ReactNode } from "react";

type DataRepositoryContextProps = CdCollectionProps &
  PlayerDefinitionsProps &
  PlayerContentProps;

export const DataRepositoryContext = createContext<DataRepositoryContextProps>({
  cds: null,
  refreshCds: () => {},
  getCdById: () => null,
  playerDefinitions: null,
  getPlayerDefinitionsByStatus: () => [],
  refreshPlayerDefinitions: () => {},
  playerContent: [[], [], []],
  refreshPlayerContent: () => {},
});

export const DataRepositoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { cds, refreshCds, getCdById } = useCdCollecitonProviderProps();
  const {
    playerDefinitions,
    getPlayerDefinitionsByStatus,
    refreshPlayerDefinitions,
  } = usePlayerDefinitionsProviderProps();
  const { playerContent, refreshPlayerContent } =
    usePlayerContentProviderProps();
  return (
    <DataRepositoryContext.Provider
      value={{
        cds,
        refreshCds,
        getCdById,
        playerDefinitions,
        getPlayerDefinitionsByStatus,
        refreshPlayerDefinitions,
        playerContent,
        refreshPlayerContent,
      }}
    >
      {children}
    </DataRepositoryContext.Provider>
  );
};
