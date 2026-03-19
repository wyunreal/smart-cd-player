"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type AudioStreamContextType = {
  ready: boolean;
  muted: boolean;
  toggleMute: () => void;
  analyserLeft: AnalyserNode | null;
  analyserRight: AnalyserNode | null;
  audioContext: AudioContext | null;
};

export const AudioStreamContext = createContext<AudioStreamContextType>({
  ready: false,
  muted: true,
  toggleMute: () => {},
  analyserLeft: null,
  analyserRight: null,
  audioContext: null,
});

const PREBUFFER_SECONDS = 0.6;

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

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserLeftRef = useRef<AnalyserNode | null>(null);
  const analyserRightRef = useRef<AnalyserNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const playbackGainRef = useRef<GainNode | null>(null);
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

    const splitter = ctx.createChannelSplitter(2);
    splitterRef.current = splitter;

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
      if (!ctx || !config || !gain) return;

      const ch = channelData.length;
      const audioBuffer = ctx.createBuffer(ch, samplesDecoded, config.sampleRate);
      for (let c = 0; c < ch; c++) {
        audioBuffer.copyToChannel(channelData[c], c);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gain);

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

      // Feed analyser immediately (zero-latency spectrum)
      feedAnalyser(channelData, samplesDecoded);

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

      // Reset playback timing so audio starts from the live stream position
      nextPlaybackTimeRef.current = ctx.currentTime;
      prebufferingRef.current = true;
      prebufferRef.current = [];
      prebufferDurationRef.current = 0;

      gain.gain.value = 1;
      setMuted(false);
    }
  }, []);

  return (
    <AudioStreamContext.Provider
      value={{ ready, muted, toggleMute, analyserLeft, analyserRight, audioContext }}
    >
      {children}
    </AudioStreamContext.Provider>
  );
};
