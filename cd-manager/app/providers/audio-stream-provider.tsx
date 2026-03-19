"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type AudioStreamStatus =
  | "connecting"
  | "ready"
  | "playing"
  | "stopped"
  | "error";

export type AudioStreamContextType = {
  status: AudioStreamStatus;
  play: () => Promise<void>;
  stop: () => Promise<void>;
  analyserLeft: AnalyserNode | null;
  analyserRight: AnalyserNode | null;
  audioContext: AudioContext | null;
};

export const AudioStreamContext = createContext<AudioStreamContextType>({
  status: "connecting",
  play: async () => {},
  stop: async () => {},
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
  const [status, setStatus] = useState<AudioStreamStatus>("connecting");
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
  const playingRef = useRef(false);
  const prebufferingRef = useRef(false);
  const prebufferRef = useRef<PrebufferItem[]>([]);
  const prebufferDurationRef = useRef(0);
  const nextPlaybackTimeRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decoderRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mountedRef = useRef(true);

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

    // Lazy-init FLAC decoder — loaded from the audio-streamer static files
    // served through the ingress at /audio-stream/
    if (!decoderRef.current) {
      const decoderUrl = "/audio-stream/flac-decoder.esm.js";
      const decoderModule = await import(/* webpackIgnore: true */ decoderUrl);
      const decoder = new decoderModule.FLACDecoder();
      await decoder.ready;
      decoderRef.current = decoder;
    }

    if (!mountedRef.current) return;

    setStatus("connecting");

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      decoderRef.current?.reset();
      nextPlaybackTimeRef.current = 0;
    };

    ws.onmessage = async (ev: MessageEvent) => {
      if (!mountedRef.current) return;

      // First message is JSON config
      if (typeof ev.data === "string") {
        const config: StreamConfig = JSON.parse(ev.data);
        configRef.current = config;
        if (playingRef.current) {
          setStatus("playing");
        } else {
          setStatus("ready");
        }
        return;
      }

      // Binary FLAC data — always decode to keep decoder state in sync
      const decoder = decoderRef.current;
      if (!decoder) return;

      const { channelData, samplesDecoded } = await decoder.decode(
        new Uint8Array(ev.data),
      );

      if (
        !playingRef.current ||
        !audioCtxRef.current ||
        samplesDecoded === 0
      ) {
        return;
      }

      // Feed analyser immediately (zero-latency spectrum)
      feedAnalyser(channelData, samplesDecoded);

      // Prebuffering phase for playback only
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
      if (!playingRef.current) {
        setStatus("error");
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 1000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [feedAnalyser, schedulePlayback]);

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

  const play = useCallback(async () => {
    const config = configRef.current;
    if (!config) return;

    // Always create a fresh AudioContext to ensure no stale scheduled buffers
    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
    }

    const ctx = new AudioContext({
      sampleRate: config.sampleRate,
      latencyHint: "interactive",
    });
    audioCtxRef.current = ctx;

    // Split stereo into L/R, each with its own analyser (not connected to destination)
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

    // Playback: prebuffered path → destination
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    playbackGainRef.current = gain;

    setAudioContext(ctx);
    setAnalyserLeft(aLeft);
    setAnalyserRight(aRight);

    nextPlaybackTimeRef.current = 0;
    prebufferingRef.current = true;
    prebufferRef.current = [];
    prebufferDurationRef.current = 0;
    playingRef.current = true;
    setStatus("playing");
  }, []);

  const stop = useCallback(async () => {
    playingRef.current = false;
    prebufferingRef.current = false;
    prebufferRef.current = [];
    prebufferDurationRef.current = 0;
    nextPlaybackTimeRef.current = 0;

    // Close the AudioContext entirely to kill all scheduled BufferSource nodes.
    // A fresh one is created on the next play() call.
    if (audioCtxRef.current) {
      await audioCtxRef.current.close();
      audioCtxRef.current = null;
      analyserLeftRef.current = null;
      analyserRightRef.current = null;
      splitterRef.current = null;
      playbackGainRef.current = null;
      setAudioContext(null);
      setAnalyserLeft(null);
      setAnalyserRight(null);
    }

    setStatus(configRef.current ? "ready" : "stopped");
  }, []);

  return (
    <AudioStreamContext.Provider
      value={{ status, play, stop, analyserLeft, analyserRight, audioContext }}
    >
      {children}
    </AudioStreamContext.Provider>
  );
};
