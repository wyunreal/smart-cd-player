import { getPlayerDefinitions } from "@/api/cd-player-definitions";
import { PlayerDefinition } from "@/api/types";
import { useCallback, useEffect, useState } from "react";

export type PlayerDefinitionsProps = {
  playerDefinitions: PlayerDefinition[] | null;
  getPlayerDefinitionsByStatus: (isActive: boolean) => PlayerDefinition[];
  refreshPlayerDefinitions: () => void;
};

const usePlayerDefinitionsProviderProps = () => {
  const [definititionsCacheVersion, setDefinitionsCacheVersion] = useState(0);
  const [playerDefinitions, setPlayerDefinitions] = useState<
    PlayerDefinition[]
  >([]);
  const refreshPlayerDefinitions = useCallback(() => {
    setDefinitionsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getPlayerDefinitions().then(setPlayerDefinitions);
  }, [definititionsCacheVersion]);
  const getPlayerDefinitionsByStatus = useCallback(
    (isActive: boolean) =>
      playerDefinitions.filter((def) => def.active === isActive),
    [playerDefinitions]
  );

  return {
    playerDefinitions,
    getPlayerDefinitionsByStatus,
    refreshPlayerDefinitions,
  };
};

export default usePlayerDefinitionsProviderProps;
