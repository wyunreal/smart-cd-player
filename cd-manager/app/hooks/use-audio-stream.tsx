"use client";

import { useContext } from "react";
import {
  AudioStreamContext,
  AudioStreamContextType,
} from "@/app/providers/audio-stream-provider";

export default function useAudioStream(): AudioStreamContextType {
  return useContext(AudioStreamContext);
}
