"use client";

import { useEffect } from "react";
import useAudioStream from "@/app/hooks/use-audio-stream";

type AudioPlayerProps = {
  shouldPlay: boolean;
};

const AudioPlayer = ({ shouldPlay }: AudioPlayerProps) => {
  const { status, play, stop } = useAudioStream();

  useEffect(() => {
    if (shouldPlay && (status === "ready" || status === "stopped")) {
      play();
    } else if (!shouldPlay && status === "playing") {
      stop();
    }
  }, [shouldPlay, status, play, stop]);

  return null;
};

export default AudioPlayer;
