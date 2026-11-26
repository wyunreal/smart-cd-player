import { getCdCollection } from "@/api/cd-collection";
import { getPlayerContent } from "@/api/cd-player-content";
import { getPlayerDefinitions } from "@/api/cd-player-definitions";
import { DEFINITIONS_COUNT } from "@/api/constants";
import {
  createIrRemoteClient,
  IrRemoteClient,
} from "@/api/player-remote/client";
import { Cd, CdSlot, DisplayState, PlayerDefinition } from "@/api/types";
import {
  buildVirtualLayouts,
  buildVisibleSlots,
  groupVisibleSlotsByArtist,
  type VirtualPlayerLayout,
  type VirtualSlot,
} from "@/lib/virtual-slots";
import {
  buildMissingStreamsError,
  createDisplayDebounceState,
  debounceDisplayStreams,
  getMissingStreams,
  getPlayerDisplayState,
  getPlayerStreamId,
  normalizeDisplayResponse,
  selectDisplayError,
  selectNowPlaying,
  type DisplayDebounceState,
} from "@/lib/display";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayerDefinitionsProps = {
  playerDefinitions: PlayerDefinition[] | null;
  getPlayerDefinitionsByStatus: (isActive: boolean) => PlayerDefinition[];
  refreshPlayerDefinitions: () => void;
  /**
   * Indexed by `remoteIndex - 1`. Players without an active IR client keep a
   * null slot so the array never shifts when a player is disabled.
   */
  irRemoteClients: (IrRemoteClient | null)[];
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

export type PlayerContentProps = {
  playerContent: PlayerSlot[][];
  refreshPlayerContent: () => void;
};

export type UnifiedPlayerViewProps = {
  /** Capacity-based layout used to translate physical slots to virtual numbers. */
  virtualLayouts: VirtualPlayerLayout[];
  /**
   * Slots rendered by the unified player view. It only contains slots with a
   * CD; empty slots are omitted from the UI.
   */
  visibleSlots: VirtualSlot[];
  /** Visible slots grouped by artist across every player. */
  visibleSlotsByArtist: Record<string, VirtualSlot[]>;
  /** Canonical 1-based virtual slot number, not an array index. */
  selectedVirtualNumber: number | null;
  setSelectedVirtualNumber: (virtualNumber: number) => void;
  /** Visible slot selected by the user. */
  selectedVirtualSlot: VirtualSlot | null;
  /**
   * `remoteIndex` of the player that owns the selected virtual slot. Falls back
   * to the now-playing player when no slot is visible.
   */
  focusedPlayer: number | null;
};

export type LastPlayedStateProps = {
  lastPlayedSlots: (number | null)[];
  setLastPlayedSlots: (slots: (number | null)[]) => void;
};

export type DisplayStateProps = {
  /** True once the first /display response has been processed. */
  displayLoaded: boolean;
  /** Display reading of the focused player. */
  displayState: DisplayState | null;
  /** Display readings indexed by player remoteIndex. */
  playerDisplayStates: Record<number, DisplayState | null>;
  /** Player picked for the "currently playing" view. */
  nowPlayingPlayer: number | null;
  /** Stream id of the player picked for the "currently playing" view. */
  nowPlayingStreamId: string | null;
  nowPlayingDisplayState: DisplayState | null;
  /**
   * Player that transport/power commands target: the "currently playing" player
   * when there is one, otherwise the focused player.
   */
  commandPlayer: number | null;
  commandDisplayState: DisplayState | null;
};

type DataRepositoryContextProps = CdCollectionProps &
  PlayerDefinitionsProps &
  PlayerContentProps &
  UnifiedPlayerViewProps &
  LastPlayedStateProps &
  DisplayStateProps;

export const DataRepositoryContext = createContext<DataRepositoryContextProps>({
  cds: null,
  refreshCds: () => {},
  getCdById: () => null,
  playerDefinitions: null,
  getPlayerDefinitionsByStatus: () => [],
  refreshPlayerDefinitions: () => {},
  irRemoteClients: [],
  playerContent: [[], [], []],
  refreshPlayerContent: () => {},
  virtualLayouts: [],
  visibleSlots: [],
  visibleSlotsByArtist: {},
  selectedVirtualNumber: null,
  setSelectedVirtualNumber: () => {},
  selectedVirtualSlot: null,
  focusedPlayer: null,
  lastPlayedSlots: [null, null, null],
  setLastPlayedSlots: () => {},
  displayLoaded: false,
  displayState: null,
  playerDisplayStates: {},
  nowPlayingPlayer: null,
  nowPlayingStreamId: null,
  nowPlayingDisplayState: null,
  commandPlayer: null,
  commandDisplayState: null,
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
  const refreshPlayerDefinitions = useCallback(() => {
    setDefinitionsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getPlayerDefinitions().then((playerDef) => {
      setPlayerDefinitions(playerDef);
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
  const [irRemoteClients, setIrRemoteClients] = useState<
    (IrRemoteClient | null)[]
  >([]);
  const [, setIrClientsVersion] = useState(0); // Add versions to force updates

  useEffect(() => {
    const clients: (IrRemoteClient | null)[] = [];
    let cancelled = false;

    const activeClients: { index: number; client: IrRemoteClient }[] = [];
    const retryTimers = new Map<number, ReturnType<typeof setTimeout>>();
    const attempts = new Map<number, number>();
    const inFlight = new Set<number>();

    playerDefinitions.forEach((def) => {
      // Skip initialization if player is not active or missing URL
      if (!def.active || !def.irCommandsUrl) {
        return;
      }

      // Keep the remote index as the slot; otherwise disabling one player
      // shifts every later client and commands go to the wrong device.
      const index = def.remoteIndex - 1;
      const client = createIrRemoteClient(def);
      clients[index] = client;
      activeClients.push({ index, client });
    });

    for (let index = 0; index < clients.length; index++) {
      if (!clients[index]) clients[index] = null;
    }

    setIrRemoteClients(clients);

    const clearRetry = (index: number) => {
      const timer = retryTimers.get(index);
      if (timer) clearTimeout(timer);
      retryTimers.delete(index);
    };

    const scheduleRetry = (index: number, client: IrRemoteClient) => {
      // `attempts` is incremented before scheduling, so the first retry is
      // 1 s, then 2 s, 4 s, and 5 s thereafter. The remote must reconnect
      // quickly when it returns; there is no cached list to fall back to.
      const attempt = Math.max(0, (attempts.get(index) ?? 0) - 1);
      const delay = Math.min(5_000, 1_000 * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 250);
      clearRetry(index);
      retryTimers.set(
        index,
        setTimeout(() => {
          retryTimers.delete(index);
          void initClient(index, client);
        }, delay + jitter),
      );
    };

    const initClient = async (
      index: number,
      client: IrRemoteClient,
    ): Promise<void> => {
      if (cancelled || inFlight.has(index)) return;
      inFlight.add(index);
      clearRetry(index);

      let success = false;
      try {
        success = await client.init();
      } catch (error) {
        console.error("IR Remote Client: init failed", error);
      } finally {
        inFlight.delete(index);
      }

      if (cancelled) return;

      // Force update after every attempt so the UI reflects new commands.
      setIrClientsVersion((v) => v + 1);

      if (success) {
        attempts.delete(index);
        return;
      }

      const attempt = (attempts.get(index) ?? 0) + 1;
      attempts.set(index, attempt);
      scheduleRetry(index, client);
    };

    const retryFailed = () => {
      if (cancelled) return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        return;
      }
      for (const { index, client } of activeClients) {
        if (inFlight.has(index) || retryTimers.has(index)) continue;
        // If this client was already initialized successfully, a focus event
        // should not trigger another command-list request.
        if (!attempts.has(index)) continue;
        void initClient(index, client);
      }
    };

    for (const { index, client } of activeClients) {
      void initClient(index, client);
    }

    if (typeof window !== "undefined") {
      window.addEventListener("online", retryFailed);
      window.addEventListener("focus", retryFailed);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", retryFailed);
    }

    return () => {
      cancelled = true;
      for (const timer of retryTimers.values()) clearTimeout(timer);
      retryTimers.clear();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", retryFailed);
        window.removeEventListener("focus", retryFailed);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", retryFailed);
      }
    };
  }, [playerDefinitions]);

  /**
   * Player Content data
   */
  const [contentCacheVersion, setContentCacheVersion] = useState(0);
  const refreshPlayerContent = useCallback(() => {
    setContentCacheVersion((v) => v + 1);
  }, []);
  const [rawContent, setRawContent] = useState<CdSlot[][]>([[], [], []]);
  const [playerContentLoaded, setPlayerContentLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPlayerContent(0),
      getPlayerContent(1),
      getPlayerContent(2),
    ])
      .then((content) => {
        if (!cancelled) setRawContent(content);
      })
      .catch(() => {
        if (!cancelled) setRawContent([[], [], []]);
      })
      .finally(() => {
        if (!cancelled) setPlayerContentLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [contentCacheVersion]);

  // Only occupied slots are exposed to the UI. This removes the `slot: 0`
  // placeholder and the index-vs-physical-slot mismatch of the previous shape.
  const playerContent = useMemo<PlayerSlot[][]>(
    () =>
      Array.from({ length: DEFINITIONS_COUNT }, (_, playerIndex) => {
        const slots = rawContent[playerIndex] ?? [];
        const bySlot = new Map<number, Cd>();

        for (const slot of slots) {
          if (slot.slot < 1 || slot.cdId == null) continue;
          const cd = cds[slot.cdId];
          if (cd) bySlot.set(slot.slot, cd);
        }

        return [...bySlot.entries()]
          .sort(([slotA], [slotB]) => slotA - slotB)
          .map(([slot, cd]) => ({ slot, cd }));
      }),
    [rawContent, cds],
  );

  const virtualLayouts = useMemo(
    () => buildVirtualLayouts(playerDefinitions ?? []),
    [playerDefinitions],
  );
  const visibleSlots = useMemo(
    () => buildVisibleSlots(playerContent, virtualLayouts),
    [playerContent, virtualLayouts],
  );
  const visibleSlotsByArtist = useMemo(
    () => groupVisibleSlotsByArtist(visibleSlots),
    [visibleSlots],
  );

  /**
   * Unified player selection
   */
  const [selectedVirtualNumber, setSelectedVirtualNumberState] = useState<
    number | null
  >(null);
  const selectionInitializedRef = useRef(false);

  const setSelectedVirtualNumber = useCallback((virtualNumber: number) => {
    selectionInitializedRef.current = true;
    setSelectedVirtualNumberState(virtualNumber);
  }, []);

  const selectedVirtualSlot = useMemo(() => {
    if (visibleSlots.length === 0) return null;

    if (selectedVirtualNumber !== null) {
      const exact = visibleSlots.find(
        (slot) => slot.number === selectedVirtualNumber,
      );
      if (exact) return exact;
    }

    if (selectedVirtualNumber === null) return visibleSlots[0];

    let nearest = visibleSlots[0];
    let nearestDistance = Math.abs(nearest.number - selectedVirtualNumber);
    for (const slot of visibleSlots.slice(1)) {
      const distance = Math.abs(slot.number - selectedVirtualNumber);
      if (distance < nearestDistance) {
        nearest = slot;
        nearestDistance = distance;
      }
    }
    return nearest;
  }, [visibleSlots, selectedVirtualNumber]);

  useEffect(() => {
    if (
      selectionInitializedRef.current ||
      !playerContentLoaded ||
      visibleSlots.length === 0
    ) {
      return;
    }

    selectionInitializedRef.current = true;
    setSelectedVirtualNumberState(visibleSlots[0].number);
  }, [playerContentLoaded, visibleSlots]);

  useEffect(() => {
    if (!selectedVirtualSlot) return;
    if (selectedVirtualNumber !== selectedVirtualSlot.number) {
      setSelectedVirtualNumberState(selectedVirtualSlot.number);
    }
  }, [selectedVirtualSlot, selectedVirtualNumber]);

  const [lastPlayedSlots, setLastPlayedSlots] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);

  /**
   * Display State (composite-video-parser polling)
   * Use ?mockDisplay=true to enable mock mode without the real service.
   */
  const [displayStreams, setDisplayStreams] = useState<
    Record<string, DisplayState>
  >({});
  const [displayLoaded, setDisplayLoaded] = useState(false);
  const mockSecondsRef = useRef(0);
  const displayDebounceRef = useRef<DisplayDebounceState>(
    createDisplayDebounceState(),
  );

  const isMockDisplay =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("mockDisplay");

  const configuredStreamIds = useMemo(
    () =>
      (playerDefinitions ?? [])
        .map((definition) => getPlayerStreamId(definition))
        .filter((streamId): streamId is string => streamId !== null),
    [playerDefinitions],
  );

  const applyDisplayStreams = useCallback(
    (next: Record<string, DisplayState>) => {
      const result = debounceDisplayStreams(
        next,
        configuredStreamIds,
        displayDebounceRef.current,
      );
      displayDebounceRef.current = result.state;
      setDisplayStreams(result.streams);
    },
    [configuredStreamIds],
  );

  useEffect(() => {
    if (!isMockDisplay) return;

    const mockTick = () => {
      const sec = mockSecondsRef.current;
      const reading: DisplayState = {
        status: "ok",
        mode: "playing",
        disc: 1,
        track: 3,
        minutes: Math.floor(sec / 60),
        seconds: sec % 60,
        timestamp: Date.now(),
      };

      const next: Record<string, DisplayState> = {};
      for (const streamId of configuredStreamIds) {
        next[streamId] = reading;
      }

      applyDisplayStreams(next);
      setDisplayLoaded(true);
      mockSecondsRef.current = sec + 2;
    };

    mockTick();
    const timer = setInterval(mockTick, 2000);
    return () => clearInterval(timer);
  }, [isMockDisplay, configuredStreamIds, applyDisplayStreams]);

  useEffect(() => {
    if (isMockDisplay) return;

    const fetchDisplay = () => {
      fetch("/api/display", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: unknown) => {
          applyDisplayStreams(data ? normalizeDisplayResponse(data) : {});
          setDisplayLoaded(true);
        })
        .catch(() => {
          applyDisplayStreams({});
          setDisplayLoaded(true);
        });
    };

    fetchDisplay();
    const timer = setInterval(fetchDisplay, 1000);
    return () => clearInterval(timer);
  }, [isMockDisplay, applyDisplayStreams]);

  // "Currently playing" view: one player at a time, playing > paused > none.
  const nowPlayingSelection = displayLoaded
    ? selectNowPlaying(playerDefinitions, displayStreams)
    : null;
  const erroredSelection = displayLoaded
    ? selectDisplayError(playerDefinitions, displayStreams)
    : null;
  const missingStreams = displayLoaded
    ? getMissingStreams(playerDefinitions, displayStreams)
    : [];
  const nowPlayingFallback =
    missingStreams.length > 0
      ? {
          displayState: buildMissingStreamsError(missingStreams),
          player: null,
          streamId: null,
        }
      : erroredSelection;
  const nowPlayingDetail = nowPlayingSelection ?? nowPlayingFallback;
  const nowPlayingDisplayState = nowPlayingDetail?.displayState ?? null;
  const nowPlayingPlayer = nowPlayingDetail?.player ?? null;
  const nowPlayingStreamId = nowPlayingDetail?.streamId ?? null;

  // Focus follows the selected virtual slot. When no CD is assigned anywhere,
  // fall back to the player that is currently playing so transport stays useful.
  const focusedPlayer =
    selectedVirtualSlot?.playerRemoteIndex ?? nowPlayingPlayer ?? null;

  const focusedPlayerDefinition = playerDefinitions.find(
    (definition) => definition.remoteIndex === focusedPlayer,
  );
  const focusedStreamId = getPlayerStreamId(focusedPlayerDefinition);
  const displayState = displayLoaded
    ? getPlayerDisplayState(focusedStreamId, displayStreams, focusedPlayer)
    : null;

  const playerDisplayStates = useMemo(() => {
    if (!displayLoaded) return {};

    const states: Record<number, DisplayState | null> = {};
    for (const definition of playerDefinitions) {
      states[definition.remoteIndex] = getPlayerDisplayState(
        getPlayerStreamId(definition),
        displayStreams,
        definition.remoteIndex,
      );
    }
    return states;
  }, [displayLoaded, playerDefinitions, displayStreams]);

  // Transport/power buttons follow the same precedence. With no playing/paused
  // player they fall back to the focused player.
  const commandPlayer = nowPlayingPlayer ?? focusedPlayer;
  const commandDisplayState =
    nowPlayingPlayer !== null ? nowPlayingDisplayState : displayState;

  return (
    <DataRepositoryContext.Provider
      value={{
        cds,
        refreshCds,
        getCdById,
        playerDefinitions,
        getPlayerDefinitionsByStatus,
        refreshPlayerDefinitions,
        irRemoteClients,
        playerContent,
        refreshPlayerContent,
        virtualLayouts,
        visibleSlots,
        visibleSlotsByArtist,
        selectedVirtualNumber,
        setSelectedVirtualNumber,
        selectedVirtualSlot,
        focusedPlayer,
        lastPlayedSlots,
        setLastPlayedSlots,
        displayLoaded,
        displayState,
        playerDisplayStates,
        nowPlayingPlayer,
        nowPlayingStreamId,
        nowPlayingDisplayState,
        commandPlayer,
        commandDisplayState,
      }}
    >
      {children}
    </DataRepositoryContext.Provider>
  );
};
