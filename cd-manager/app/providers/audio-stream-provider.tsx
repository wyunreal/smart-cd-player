"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export const EQ_BANDS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;
const EQ_Q = 1.414; // ~1 octave bandwidth
const EQ_STORAGE_KEY = "eq-gains";
const EQ_ENABLED_STORAGE_KEY = "eq-enabled";

export type AudioStreamContextType = {
  ready: boolean;
  muted: boolean;
  toggleMute: () => void;
  analyserLeft: AnalyserNode | null;
  analyserRight: AnalyserNode | null;
  audioContext: AudioContext | null;
  eqEnabled: boolean;
  setEqEnabled: (enabled: boolean) => void;
  eqGains: number[];
  setEqGain: (bandIndex: number, gain: number) => void;
  resetEq: () => void;
};

const defaultEqGains = () => EQ_BANDS.map(() => 0);

const loadEqGains = (): number[] => {
  try {
    const stored = localStorage.getItem(EQ_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === EQ_BANDS.length) return parsed;
    }
  } catch { /* ignore */ }
  return defaultEqGains();
};

const loadEqEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(EQ_ENABLED_STORAGE_KEY);
    if (stored !== null) return JSON.parse(stored);
  } catch { /* ignore */ }
  return false;
};

export const AudioStreamContext = createContext<AudioStreamContextType>({
  ready: false,
  muted: true,
  toggleMute: () => {},
  analyserLeft: null,
  analyserRight: null,
  audioContext: null,
  eqEnabled: false,
  setEqEnabled: () => {},
  eqGains: defaultEqGains(),
  setEqGain: () => {},
  resetEq: () => {},
});

const PREBUFFER_SECONDS = 2;

type StreamConfig = {
  type: string;
  codec: string;
  sampleRate: number;
  channels: number;
  bitDepth: number;
};

type PrebufferItem = {
  channelData: Float32Array[];
  samplesDecoded: number;
};

export const AudioStreamProvider = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [analyserLeft, setAnalyserLeft] = useState<AnalyserNode | null>(null);
  const [analyserRight, setAnalyserRight] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [eqEnabled, setEqEnabledState] = useState(false);
  const [eqGains, setEqGainsState] = useState<number[]>(defaultEqGains);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserLeftRef = useRef<AnalyserNode | null>(null);
  const analyserRightRef = useRef<AnalyserNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const eqInputRef = useRef<GainNode | null>(null);
  const eqEnabledRef = useRef(false);
  const eqGainsRef = useRef<number[]>(defaultEqGains());
  const configRef = useRef<StreamConfig | null>(null);
  const prebufferingRef = useRef(true);
  const prebufferRef = useRef<PrebufferItem[]>([]);
  const prebufferDurationRef = useRef(0);
  const nextPlaybackTimeRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decoderRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mountedRef = useRef(true);
  const audioGraphReadyRef = useRef(false);

  // Create the AudioContext and audio graph once when the stream config arrives.
  const ensureAudioGraph = useCallback((config: StreamConfig) => {
    if (audioGraphReadyRef.current) return;

    const ctx = new AudioContext({
      sampleRate: config.sampleRate,
      latencyHint: "interactive",
    });
    audioCtxRef.current = ctx;

    // EQ chain: input gain → 10 peaking filters → output
    const eqInput = ctx.createGain();
    eqInputRef.current = eqInput;

    const savedGains = loadEqGains();
    const savedEnabled = loadEqEnabled();
    eqGainsRef.current = savedGains;
    eqEnabledRef.current = savedEnabled;
    setEqGainsState(savedGains);
    setEqEnabledState(savedEnabled);

    const filters: BiquadFilterNode[] = EQ_BANDS.map((freq, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = EQ_Q;
      filter.gain.value = savedEnabled ? savedGains[i] : 0;
      return filter;
    });

    // Chain: eqInput → filter[0] → filter[1] → ... → filter[9]
    eqInput.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    eqFiltersRef.current = filters;
    const eqOutput = filters[filters.length - 1];

    const splitter = ctx.createChannelSplitter(2);
    splitterRef.current = splitter;
    eqOutput.connect(splitter);

    const aLeft = ctx.createAnalyser();
    aLeft.fftSize = 8192;
    aLeft.smoothingTimeConstant = 0.8;
    splitter.connect(aLeft, 0);
    analyserLeftRef.current = aLeft;

    const aRight = ctx.createAnalyser();
    aRight.fftSize = 8192;
    aRight.smoothingTimeConstant = 0.8;
    splitter.connect(aRight, 1);
    analyserRightRef.current = aRight;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    eqOutput.connect(gain);
    gain.connect(ctx.destination);
    playbackGainRef.current = gain;

    setAudioContext(ctx);
    setAnalyserLeft(aLeft);
    setAnalyserRight(aRight);
    setReady(true);

    audioGraphReadyRef.current = true;
  }, []);

  const feedAnalyser = useCallback(
    (channelData: Float32Array[], samplesDecoded: number) => {
      const ctx = audioCtxRef.current;
      const config = configRef.current;
      const splitter = splitterRef.current;
      if (!ctx || !config || !splitter) return;

      const ch = channelData.length;
      const audioBuffer = ctx.createBuffer(ch, samplesDecoded, config.sampleRate);
      for (let c = 0; c < ch; c++) {
        audioBuffer.copyToChannel(channelData[c], c);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Connect directly to the splitter (analysers only), bypassing
      // EQ and playback gain to keep visualisation in sync with the
      // live stream and avoid sending audio to speakers.
      source.connect(splitter);
      source.start();
    },
    [],
  );

  const schedulePlayback = useCallback(
    (channelData: Float32Array[], samplesDecoded: number) => {
      const ctx = audioCtxRef.current;
      const config = configRef.current;
      const gain = playbackGainRef.current;
      const eqInput = eqInputRef.current;
      if (!ctx || !config || !gain || !eqInput) return;

      const ch = channelData.length;
      const audioBuffer = ctx.createBuffer(ch, samplesDecoded, config.sampleRate);
      for (let c = 0; c < ch; c++) {
        audioBuffer.copyToChannel(channelData[c], c);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // EQ output is permanently connected to both splitter and gain,
      // so routing through eqInput feeds both analyser and playback.
      source.connect(eqInput);

      const startTime = Math.max(ctx.currentTime, nextPlaybackTimeRef.current);
      source.start(startTime);
      nextPlaybackTimeRef.current = startTime + audioBuffer.duration;
    },
    [],
  );

  const connect = useCallback(async () => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${location.host}/audio-stream/ws`;

    if (!decoderRef.current) {
      const decoderUrl = "/audio-stream/flac-decoder.esm.js";
      const decoderModule = await import(/* webpackIgnore: true */ decoderUrl);
      const decoder = new decoderModule.FLACDecoder();
      await decoder.ready;
      decoderRef.current = decoder;
    }

    if (!mountedRef.current) return;

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      decoderRef.current?.reset();
      nextPlaybackTimeRef.current = 0;
      prebufferingRef.current = true;
      prebufferRef.current = [];
      prebufferDurationRef.current = 0;
    };

    ws.onmessage = async (ev: MessageEvent) => {
      if (!mountedRef.current) return;

      // First message is JSON config
      if (typeof ev.data === "string") {
        const config: StreamConfig = JSON.parse(ev.data);
        configRef.current = config;
        ensureAudioGraph(config);
        return;
      }

      // Binary FLAC data — always decode and feed the audio graph
      const decoder = decoderRef.current;
      if (!decoder || !audioCtxRef.current) return;

      const { channelData, samplesDecoded } = await decoder.decode(
        new Uint8Array(ev.data),
      );

      if (samplesDecoded === 0) return;

      // When muted, feed the analyser directly (bypasses EQ/prebuffer)
      // so the visualisation stays in sync with the live amplifier output.
      // When unmuted, the analyser is fed exclusively via schedulePlayback
      // (through the EQ chain) so the visualisation matches what the user hears.
      const unmuted = playbackGainRef.current && playbackGainRef.current.gain.value > 0;
      if (!unmuted) {
        feedAnalyser(channelData, samplesDecoded);
      }

      // Prebuffering phase for gapless playback
      if (prebufferingRef.current) {
        prebufferRef.current.push({
          channelData: channelData.map((ch: Float32Array) => ch.slice()),
          samplesDecoded,
        });
        prebufferDurationRef.current +=
          samplesDecoded / configRef.current!.sampleRate;

        if (prebufferDurationRef.current < PREBUFFER_SECONDS) return;

        // Prebuffer complete — flush to playback
        prebufferingRef.current = false;
        nextPlaybackTimeRef.current = audioCtxRef.current.currentTime;
        for (const item of prebufferRef.current) {
          schedulePlayback(item.channelData, item.samplesDecoded);
        }
        prebufferRef.current = [];
        prebufferDurationRef.current = 0;
        return;
      }

      schedulePlayback(channelData, samplesDecoded);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 1000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [feedAnalyser, schedulePlayback, ensureAudioGraph]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
      audioCtxRef.current?.close();
    };
  }, [connect]);

  // Handle iOS Safari "interrupted" state (tab switch, screen lock, phone call).
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const ctx = audioCtxRef.current;
        if (ctx && (ctx.state === "suspended" || ctx.state === ("interrupted" as AudioContextState))) {
          ctx.resume();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Toggle mute/unmute. Always called from an onClick handler (user gesture).
  const toggleMute = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gain = playbackGainRef.current;
    if (!ctx || !gain) return;

    if (gain.gain.value > 0) {
      gain.gain.value = 0;
      setMuted(true);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.audioSession) {
        nav.audioSession.type = "playback";
      }

      if (ctx.state === "suspended" || ctx.state === ("interrupted" as AudioContextState)) {
        ctx.resume();
      }

      // Replace the eqInput node so that any BufferSources scheduled while
      // muted are disconnected. Sources connect to eqInput (upstream of gain),
      // so replacing only the GainNode would still let old sources flow through
      // the EQ chain into the new gain, causing brief "double audio".
      const oldEqInput = eqInputRef.current;
      if (oldEqInput) {
        oldEqInput.disconnect();
      }
      const newEqInput = ctx.createGain();
      newEqInput.connect(eqFiltersRef.current[0]);
      eqInputRef.current = newEqInput;

      gain.gain.value = 1;

      // Reset playback timing so audio starts from the live stream position
      nextPlaybackTimeRef.current = ctx.currentTime;
      prebufferingRef.current = true;
      prebufferRef.current = [];
      prebufferDurationRef.current = 0;

      setMuted(false);
    }
  }, []);

  const setEqEnabled = useCallback((enabled: boolean) => {
    eqEnabledRef.current = enabled;
    setEqEnabledState(enabled);
    localStorage.setItem(EQ_ENABLED_STORAGE_KEY, JSON.stringify(enabled));
    eqFiltersRef.current.forEach((filter, i) => {
      filter.gain.value = enabled ? eqGainsRef.current[i] : 0;
    });
  }, []);

  const setEqGain = useCallback((bandIndex: number, gain: number) => {
    const clamped = Math.max(EQ_MIN_DB, Math.min(EQ_MAX_DB, gain));
    const newGains = [...eqGainsRef.current];
    newGains[bandIndex] = clamped;
    eqGainsRef.current = newGains;
    setEqGainsState(newGains);
    localStorage.setItem(EQ_STORAGE_KEY, JSON.stringify(newGains));
    if (eqEnabledRef.current && eqFiltersRef.current[bandIndex]) {
      eqFiltersRef.current[bandIndex].gain.value = clamped;
    }
  }, []);

  const resetEq = useCallback(() => {
    const zeros = defaultEqGains();
    eqGainsRef.current = zeros;
    setEqGainsState(zeros);
    localStorage.setItem(EQ_STORAGE_KEY, JSON.stringify(zeros));
    eqFiltersRef.current.forEach((filter) => {
      filter.gain.value = 0;
    });
  }, []);

  return (
    <AudioStreamContext.Provider
      value={{
        ready, muted, toggleMute, analyserLeft, analyserRight, audioContext,
        eqEnabled, setEqEnabled, eqGains, setEqGain, resetEq,
      }}
    >
      {children}
    </AudioStreamContext.Provider>
  );
};
