import { getCdCollection } from "@/api/cd-collection";
import { getPlayerContent } from "@/api/cd-player-content";
import { getPlayerDefinitions } from "@/api/cd-player-definitions";
import { createIrRemoteClient, IrRemoteClient } from "@/api/player-remote/client";
import { Cd, CdSlot, PlayerDefinition } from "@/api/types";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

export type PlayerDefinitionsProps = {
  playerDefinitions: PlayerDefinition[] | null;
  getPlayerDefinitionsByStatus: (isActive: boolean) => PlayerDefinition[];
  selectedPlayer: number | null;
  setSelectedPlayer: (player: number) => void;
  refreshPlayerDefinitions: () => void;
  irRemoteClients: IrRemoteClient[];
};

export type CdCollectionProps = {
  cds: { [id: number]: Cd } | null;
  refreshCds: () => void;
  getCdById: (id: number) => Cd | null;
};

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

export type PlayerStateProps = {
  selectedPlayerSlots: number[];
  setSelectedPlayerSlots: (slots: number[]) => void;
};

type DataRepositoryContextProps = CdCollectionProps &
  PlayerDefinitionsProps &
  PlayerContentProps &
  PlayerStateProps;

const calculateContentByArtist = (
  slots: PlayerSlot[],
): PlayerContentByArtist => {
  const contentByArtist: PlayerContentByArtist = {};
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

export const DataRepositoryContext = createContext<DataRepositoryContextProps>({
  cds: null,
  refreshCds: () => { },
  getCdById: () => null,
  playerDefinitions: null,
  getPlayerDefinitionsByStatus: () => [],
  selectedPlayer: null,
  setSelectedPlayer: () => { },
  refreshPlayerDefinitions: () => { },
  irRemoteClients: [],
  playerContent: [[], [], []],
  playerContentByArtist: [{}, {}, {}],
  refreshPlayerContent: () => { },
  selectedPlayerSlots: [0, 0, 0],
  setSelectedPlayerSlots: () => { },
});

export const DataRepositoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  /**
   * CD Collection data
   */
  const [cdsCacheVersion, setCdsCacheVersion] = useState(0);
  const [cds, setCds] = useState<{ [id: number]: Cd }>({});
  const refreshCds = useCallback(() => {
    setCdsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getCdCollection().then((cds) => {
      const cdsById = cds.reduce<Record<number, Cd>>((acc, cd) => {
        acc[cd.id] = cd;
        return acc;
      }, {});
      setCds(cdsById);
    });
  }, [cdsCacheVersion]);
  const getCdById = useCallback((id: number) => cds[id] || null, [cds]);

  /**
   * Player Definitions data
   */
  const [definititionsCacheVersion, setDefinitionsCacheVersion] = useState(0);
  const [playerDefinitions, setPlayerDefinitions] = useState<
    PlayerDefinition[]
  >([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const refreshPlayerDefinitions = useCallback(() => {
    setDefinitionsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getPlayerDefinitions().then((playerDef) => {
      setPlayerDefinitions(playerDef);
      const selectedPlayerDefinition = playerDef.find(
        (def) => def.remoteIndex === selectedPlayer,
      );
      if (!selectedPlayerDefinition) {
        if (playerDef.length > 0) {
          setSelectedPlayer(playerDef[0].remoteIndex);
        } else {
          setSelectedPlayer(null);
        }
      }
    });
  }, [definititionsCacheVersion]);
  const getPlayerDefinitionsByStatus = useCallback(
    (isActive: boolean) =>
      playerDefinitions.filter((def) => def.active === isActive),
    [playerDefinitions],
  );

  /**
   * IR Remote Clients
   */
  const [irRemoteClients, setIrRemoteClients] = useState<IrRemoteClient[]>([]);
  const [, setIrClientsVersion] = useState(0); // Add versions to force updates
  
  useEffect(() => {
    const clients: IrRemoteClient[] = [];
    const initPromises: Promise<void>[] = [];
    
    playerDefinitions.forEach((def) => {
      // Skip initialization if player is not active or missing URL
      if (!def.active || !def.irCommandsUrl) {
         return;
      }
      
      const client = createIrRemoteClient(def);
      const initPromise = client.init()
        .then(() => {
            // Force update when a client initializes
            setIrClientsVersion(v => v + 1);
        })
        .catch((err) =>
            console.warn(`IR Remote Client init failed for player ${def.remoteIndex}:`, err)
        );
      initPromises.push(initPromise);
      clients.push(client);
    });
    setIrRemoteClients(clients);
    
    // Also force update when all done, just in case
    Promise.allSettled(initPromises).then(() => setIrClientsVersion(v => v + 1));
    
  }, [playerDefinitions]);

  /**
   * Player Content data
   */
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
            (_, slotIndex: number) => ({ slot: slotIndex + 1, cd: null }),
          );
          let minSlot = playerDefinitions[index].capacity;
          let maxSlot = 1;
          for (const slot of rawContent[index]) {
            const cd = slot.cdId ? cds[slot.cdId] : null;
            slots[slot.slot - 1].cd = cd;
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
        : [[], [], []],
    );
  }, [playerDefinitions, rawContent, cds]);

  useEffect(() => {
    setPlayerContentByArtist([
      calculateContentByArtist(playerContent[0]),
      calculateContentByArtist(playerContent[1]),
      calculateContentByArtist(playerContent[2]),
    ]);
  }, [playerContent]);

  /**
   * Player State
   */
  const [selectedPlayerSlots, setSelectedPlayerSlots] = useState<number[]>([
    0, 0, 0,
  ]);

  // Validate selected slots against content
  useEffect(() => {
    if (playerContent.some((content) => content.length > 0)) {
       setSelectedPlayerSlots((prev) => {
        return prev.map((slot, index) => {
            const content = playerContent[index];
            if (content.length === 0) return 0;
            // available slots are 0 to content.length - 1
            if (slot >= content.length) {
                return 0;
            }
            return slot;
        });
       });
    }
  }, [playerContent]);

  return (
    <DataRepositoryContext.Provider
      value={{
        cds,
        refreshCds,
        getCdById,
        playerDefinitions,
        getPlayerDefinitionsByStatus,
        selectedPlayer,
        setSelectedPlayer,
        refreshPlayerDefinitions,
        irRemoteClients,
        playerContent,
        playerContentByArtist,
        refreshPlayerContent,
        selectedPlayerSlots,
        setSelectedPlayerSlots,
      }}
    >
      {children}
    </DataRepositoryContext.Provider>
  );
};
