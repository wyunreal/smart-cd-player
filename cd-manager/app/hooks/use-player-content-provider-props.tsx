import { getPlayerContent } from "@/api/cd-player-content";
import { Cd, CdSlot } from "@/api/types";
import { useCallback, useEffect, useState } from "react";
import usePlayerDefinitionsProviderProps from "./use-player-definitions-provider-props";
import useCdCollectionProviderProps from "./use-cd-collection-provider-props";

export type PlayerSlot = {
  slot: number;
  cd: Cd | null;
};

export type PlayerContentByArtist = {
  [artist: string]: PlayerSlot[];
};

export type PlayerContentProps = {
  playerContent: PlayerSlot[][];
  playerContentByArtist: PlayerContentByArtist[];
  refreshPlayerContent: () => void;
};

const calculateContentByArtist = (
  slots: PlayerSlot[]
): PlayerContentByArtist => {
  let contentByArtist: PlayerContentByArtist = {};
  for (const slot of slots) {
    if (slot.cd) {
      if (contentByArtist[slot.cd.artist] === undefined) {
        contentByArtist[slot.cd.artist] = [];
      }
      contentByArtist[slot.cd.artist].push(slot);
    }
  }
  return contentByArtist;
};

const usePlayerContentProviderProps = () => {
  const [contentCacheVersion, setContentCacheVersion] = useState(0);
  const [playerContent, setPlayerContent] = useState<PlayerSlot[][]>([
    [],
    [],
    [],
  ]);
  const [playerContentByArtist, setPlayerContentByArtist] = useState<
    PlayerContentByArtist[]
  >([{}, {}, {}]);
  const refreshPlayerContent = useCallback(() => {
    setContentCacheVersion((v) => v + 1);
  }, []);

  const { playerDefinitions } = usePlayerDefinitionsProviderProps();
  const { cds } = useCdCollectionProviderProps();
  const [rawContent, setRawContent] = useState<CdSlot[][]>([[], [], []]);
  useEffect(() => {
    Promise.all([
      getPlayerContent(0),
      getPlayerContent(1),
      getPlayerContent(2),
    ]).then(setRawContent);
  }, [contentCacheVersion]);

  useEffect(() => {
    setPlayerContent(
      playerDefinitions !== null &&
        playerDefinitions.length !== 0 &&
        cds !== null
        ? Array.from({ length: 3 }).map((_, index: number) => {
            let slots: PlayerSlot[] = Array.from(
              { length: playerDefinitions[index].capacity },
              (_, slotIndex: number) => ({ slot: slotIndex + 1, cd: null })
            );
            let minSlot = playerDefinitions[index].capacity;
            let maxSlot = 1;
            for (const slot of rawContent[index]) {
              slots[slot.slot - 1].cd = cds[slot.cdId];
              if (slot.slot < minSlot) {
                minSlot = slot.slot;
              }
              if (slot.slot > maxSlot) {
                maxSlot = slot.slot;
              }
            }
            slots = slots.slice(minSlot - 1, maxSlot);
            return slots.length > 0 ? slots : [{ slot: 0, cd: null }];
          })
        : [[], [], []]
    );
  }, [playerDefinitions, rawContent, cds]);

  useEffect(() => {
    setPlayerContentByArtist([
      calculateContentByArtist(playerContent[0]),
      calculateContentByArtist(playerContent[1]),
      calculateContentByArtist(playerContent[2]),
    ]);
  }, [playerContent]);

  return {
    playerContent,
    playerContentByArtist,
    refreshPlayerContent,
  };
};

export default usePlayerContentProviderProps;
