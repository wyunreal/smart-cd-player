"use client";

import NowPlayingView from "./now-playing-view";
import { useMockPlayback } from "./use-mock-playback";

/**
 * Disposable container used while iterating on the visual design.
 * Replace it with a connected container once the UI is approved.
 */
const NowPlayingMock = () => {
  const playback = useMockPlayback();

  return <NowPlayingView {...playback} />;
};

export default NowPlayingMock;
