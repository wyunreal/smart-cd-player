import useCdCollectionProviderProps, {
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
  playerContentByArtist: [{}, {}, {}],
  refreshPlayerContent: () => {},
});

export const DataRepositoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { cds, refreshCds, getCdById } = useCdCollectionProviderProps();
  const {
    playerDefinitions,
    getPlayerDefinitionsByStatus,
    refreshPlayerDefinitions,
  } = usePlayerDefinitionsProviderProps();
  const { playerContent, playerContentByArtist, refreshPlayerContent } =
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
        playerContentByArtist,
        refreshPlayerContent,
      }}
    >
      {children}
    </DataRepositoryContext.Provider>
  );
};
