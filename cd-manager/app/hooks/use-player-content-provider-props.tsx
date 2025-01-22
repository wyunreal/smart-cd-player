import { getPlayerContent } from "@/api/cd-player-content";
import { Cd, CdSlot } from "@/api/types";
import { useCallback, useEffect, useState } from "react";
import usePlayerDefinitionsProviderProps from "./use-player-definitions-provider-props";
import useCdCollecitonProviderProps from "./use-cd-collection-provider-props";

export type PlayerSlot = {
  slot: number;
  cd: Cd | null;
};

export type PlayerContentProps = {
  playerContent: PlayerSlot[][];
  refreshPlayerContent: () => void;
};

const usePlayerContentProviderProps = () => {
  const [contentCacheVersion, setContentCacheVersion] = useState(0);
  const [playerContent, setPlayerContent] = useState<PlayerSlot[][]>([
    [],
    [],
    [],
  ]);
  const refreshPlayerContent = useCallback(() => {
    setContentCacheVersion((v) => v + 1);
  }, []);

  const { playerDefinitions } = usePlayerDefinitionsProviderProps();
  const { cds } = useCdCollecitonProviderProps();
  const [rawContent, setRawContent] = useState<CdSlot[][]>([[], [], []]);

  useEffect(() => {
    Promise.all([
      getPlayerContent(0),
      getPlayerContent(1),
      getPlayerContent(2),
    ]).then(setRawContent);
  }, [contentCacheVersion]);
  console.log(playerContent);
  useEffect(() => {
    setPlayerContent(
      playerDefinitions !== null &&
        playerDefinitions.length !== 0 &&
        cds !== null
        ? Array.from({ length: 3 }).map((_, index: number) => {
            let slots: PlayerSlot[] = Array.from(
              { length: playerDefinitions[index].capacity },
              (_, slotIndex: number) => ({ slot: slotIndex, cd: null })
            );
            let minSlot = playerDefinitions[index].capacity - 1;
            let maxSlot = 0;
            for (const slot of rawContent[index]) {
              slots[slot.slot].cd = cds[slot.cdId];
              if (slot.slot < minSlot) {
                minSlot = slot.slot;
              }
              if (slot.slot > maxSlot) {
                maxSlot = slot.slot;
              }
            }
            return slots.slice(minSlot, maxSlot + 1);
          })
        : [[], [], []]
    );
  }, [playerDefinitions, rawContent, cds]);

  return {
    playerContent,
    refreshPlayerContent,
  };
};

export default usePlayerContentProviderProps;
