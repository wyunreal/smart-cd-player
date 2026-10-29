"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Box, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import type { DisplayMode } from "@/api/types";
import CdHub, { HUB_TILT_MS } from "./cd-hub";

/** Seconds per revolution at full speed. */
const DISC_SPIN_SECONDS = 0.2;
/** Time the disc takes to reach full speed from rest, or to come to rest. */
const SPIN_RAMP_MS = 2000;

/**
 * Extra zoom applied to the rotating artwork. The circular frame clips this
 * many pixels from the image's outer edge, removing the thin margin left by
 * the processing crop without moving the disc centre.
 */
const DISC_IMAGE_EDGE_CROP_PX = 16;

/** How long the disc takes to drop into the tray / rise back out of it. */
const DISC_ENTER_MS = 560;
const DISC_EXIT_MS = 480;
/**
 * Width of the static engraved groove around the disc. The groove's outer
 * radius is this many pixels larger than the disc.
 */
const DISC_GROOVE_PX = 4;

/**
 * Tray floor and groove shading. The light theme uses a cool, polished
 * silver-blue so the recess reads as a different plane without turning into
 * a dark grey line; the dark theme keeps its deep metallic shadow.
 */
const LIGHT_FLOOR_BACKGROUND =
  "radial-gradient(circle at 50% 38%, #f7f9fc 0%, #e9eef4 50%, #dbe2ea 100%)";
const DARK_FLOOR_BACKGROUND =
  "radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 45%, rgba(0, 0, 0, 0.22) 100%)";

const LIGHT_GROOVE_BACKGROUND = `
  radial-gradient(circle closest-side,
    rgba(55, 75, 110, 0.34) calc(100% - ${DISC_GROOVE_PX}px),
    rgba(55, 75, 110, 0.06) calc(100% - 1px)),
  conic-gradient(from 135deg,
    rgba(255, 255, 255, 1) 0deg,
    rgba(185, 200, 220, 0.3) 70deg,
    rgba(55, 75, 110, 0.34) 180deg,
    rgba(185, 200, 220, 0.3) 290deg,
    rgba(255, 255, 255, 1) 360deg),
  linear-gradient(145deg, #f1f4f8, #cbd4df)
`;
const DARK_GROOVE_BACKGROUND = `
  radial-gradient(circle closest-side,
    rgba(0, 0, 0, 0.65) calc(100% - ${DISC_GROOVE_PX}px),
    rgba(0, 0, 0, 0.2) calc(100% - 1px)),
  conic-gradient(from 135deg,
    rgba(255, 255, 255, 0.34) 0deg,
    rgba(255, 255, 255, 0.02) 70deg,
    rgba(0, 0, 0, 0.7) 180deg,
    rgba(255, 255, 255, 0.02) 290deg,
    rgba(255, 255, 255, 0.34) 360deg),
  linear-gradient(145deg, rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.9))
`;
/**
 * Short head start for the spindle cap: the disc only starts travelling once
 * the cap has begun lifting off, so the release reads before the disc moves.
 */
const DISC_TRAVEL_DELAY_MS = 140;
/** Offsets that keep the disc fully out of sight above the tray. */
const DISC_HIDDEN_TRANSFORM = "translate3d(0, -115%, 0)";
const DISC_RESTING_TRANSFORM = "translate3d(0, 0, 0)";

/**
 * The disc is only in the tray while the player is playing or paused. The
 * "stopped" and "off" states park it above the tray, out of view.
 */
export type DiscPhase = "hidden" | "entering" | "present" | "leaving";

/**
 * Which face textures are mounted. Both exist only while crossfading; once
 * the fade ends the other one is unmounted so the rotating layer only paints
 * a single texture at full speed or at rest.
 */
type FaceTexture = "sharp" | "crossfade" | "blurred";

/**
 * Baked rotational motion blur. A real disc smears along concentric circles
 * during the exposure; averaging several slightly rotated copies of the face
 * gives the same radial blur while the compositor still rotates one texture.
 */
const MAX_FACE_TEXTURE_SIZE = 1024;
const MOTION_BLUR_SAMPLES = 16;
/** One frame of exposure at 60 Hz: 360° / 60 / spin duration. */
const MOTION_BLUR_DEGREES = 6 / DISC_SPIN_SECONDS;

/**
 * Blurred face textures are pure data derived from the artwork, so keep them
 * in memory. Switching back to a previously seen album reuses the image
 * instead of rasterising the blur again.
 */
const blurredFaceCache = new Map<string, string>();
const MAX_BLURRED_FACE_CACHE = 12;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

type CdDiscProps = {
  imageSrc: string;
  /** Playback mode drives both the drop/exit cycle and the rotation. */
  mode: DisplayMode;
  /** Reports the internal placement phase so the panel can follow it. */
  onPhaseChange?: (phase: DiscPhase) => void;
};

const CdDisc = ({ imageSrc, mode, onPhaseChange }: CdDiscProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = theme.palette.primary.main;
  const white = theme.palette.common.white;
  const black = theme.palette.common.black;
  const grey = theme.palette.grey;
  const extra = theme.palette.extra;

  const isPresent = mode === "playing" || mode === "paused";

  // The disc starts parked if the player is already stopped, or settled if it
  // is playing: mounting must not play the drop animation on every page load.
  const [phase, setPhase] = useState<DiscPhase>(
    isPresent ? "present" : "hidden",
  );
  const wasPresentRef = useRef(isPresent);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [blurredSrc, setBlurredSrc] = useState<string | null>(null);
  /**
   * Artwork currently printed on the disc. When the player changes discs we
   * keep the outgoing face until it has finished slowing down and leaving.
   */
  const [faceSrc, setFaceSrc] = useState(imageSrc);
  const [faceTexture, setFaceTexture] = useState<FaceTexture>(
    isPresent ? "blurred" : "sharp",
  );
  const blurredFaceRef = useRef<HTMLImageElement | null>(null);
  const faceRef = useRef<HTMLDivElement | null>(null);
  const floorRef = useRef<HTMLDivElement | null>(null);
  const grooveRef = useRef<HTMLDivElement | null>(null);
  /** Current playback rate of the CSS rotation (0 = rest, 1 = full speed). */
  const spinRateRef = useRef(isPresent ? 1 : 0);
  const spinRampFrameRef = useRef<number | null>(null);

  // Let the tray floor and the groove light follow the same pointer-driven
  // angle as the hub. Only the gradients turn: the ring geometry is circular,
  // so the border itself stays exactly where it is.
  const handleTilt = useCallback((angle: number) => {
    if (floorRef.current) floorRef.current.style.rotate = `${angle}deg`;
    if (grooveRef.current) grooveRef.current.style.rotate = `${angle}deg`;
  }, []);

  const setSpinRate = useCallback((rate: number) => {
    spinRateRef.current = rate;
    const animation = faceRef.current?.getAnimations()[0];
    if (animation) animation.playbackRate = rate;
    // Crossfade the sharp face into the motion-blurred one as the disc gains
    // speed (and back out as it slows down).
    if (blurredFaceRef.current) {
      blurredFaceRef.current.style.opacity = String(rate);
    }
    // Keep only the layer that is actually visible when fully spun up/down.
    setFaceTexture(rate <= 0 ? "sharp" : rate >= 1 ? "blurred" : "crossfade");
  }, []);

  /**
   * Ease the CSS rotation between 0 and full speed. Playback rate changes are
   * handled by the compositor, so the spinning stays on its own layer while
   * only a number is updated from the main thread during the ramp.
   */
  const rampSpin = useCallback(
    (target: number, onDone?: () => void) => {
      if (spinRampFrameRef.current !== null) {
        cancelAnimationFrame(spinRampFrameRef.current);
        spinRampFrameRef.current = null;
      }

      const animation = faceRef.current?.getAnimations()[0];
      const startRate = animation?.playbackRate ?? spinRateRef.current;
      const duration = reduceMotion ? 0 : SPIN_RAMP_MS;

      if (duration === 0 || startRate === target) {
        setSpinRate(target);
        onDone?.();
        return;
      }

      // Keep both faces mounted while the fade runs; they are swapped for a
      // single layer once the ramp lands.
      setFaceTexture("crossfade");

      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const rate = startRate + (target - startRate) * progress;

        spinRateRef.current = rate;
        if (animation) animation.playbackRate = rate;
        if (blurredFaceRef.current) {
          blurredFaceRef.current.style.opacity = String(rate);
        }

        if (progress < 1) {
          spinRampFrameRef.current = requestAnimationFrame(step);
        } else {
          spinRampFrameRef.current = null;
          setSpinRate(target);
          onDone?.();
        }
      };

      spinRampFrameRef.current = requestAnimationFrame(step);
    },
    [reduceMotion, setSpinRate],
  );

  // Never leave a ramp loop running after unmount.
  useEffect(() => {
    return () => {
      if (spinRampFrameRef.current !== null) {
        cancelAnimationFrame(spinRampFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setDocumentVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);

    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Playback start drops the disc in; stopping lets it slow down in place and
  // only then sends it back up.
  useEffect(() => {
    if (isPresent === wasPresentRef.current) return;
    wasPresentRef.current = isPresent;

    if (isPresent) {
      // Already in the tray (e.g. play during the slow-down): just spin up.
      if (phase === "present") return;

      setSpinRate(0);
      setPhase("entering");
      return;
    }

    if (phase === "present") {
      rampSpin(0, () => setPhase("leaving"));
      return;
    }

    setPhase("leaving");
  }, [isPresent, phase, rampSpin, setSpinRate]);

  // Spin up only once the disc has finished dropping into place.
  useEffect(() => {
    if (phase !== "present" || !isPresent) return;
    rampSpin(1);
  }, [isPresent, phase, rampSpin]);

  // The disc leaves the tray once it has completely stopped.
  useEffect(() => {
    if (phase === "entering") {
      const timer = setTimeout(
        () => setPhase("present"),
        reduceMotion ? 0 : DISC_TRAVEL_DELAY_MS + DISC_ENTER_MS,
      );
      return () => clearTimeout(timer);
    }

    if (phase === "leaving") {
      const timer = setTimeout(
        () => setPhase("hidden"),
        reduceMotion ? 0 : DISC_TRAVEL_DELAY_MS + DISC_EXIT_MS,
      );
      return () => clearTimeout(timer);
    }
  }, [phase, reduceMotion]);

  // Keep the outgoing disc's artwork while it spins down and slides out. Once
  // it is hidden (and therefore invisible), switch to the next disc's face.
  const isStopping = !isPresent && phase !== "hidden";

  useEffect(() => {
    if (isStopping) return;
    setFaceSrc(imageSrc);
  }, [imageSrc, isStopping]);

  // Bake a rotational (tangential) motion blur into the face texture. Drawing
  // the art several times with a small rotation offset around the centre and
  // averaging with "lighter" produces the same radial smear a real disc has.
  // The result is turned back into a plain image so the compositor rotates a
  // static texture instead of keeping a canvas layer alive every frame.
  useEffect(() => {
    // Keep both the sharp face and its blurred texture untouched while the
    // outgoing disc is still slowing down or leaving the tray.
    if (isStopping) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setBlurredSrc(null);
      return;
    }

    const blurDegrees = MOTION_BLUR_DEGREES;
    const samples = MOTION_BLUR_SAMPLES;
    const step = blurDegrees / Math.max(1, samples - 1);

    const displayWidth =
      (faceRef.current?.clientWidth || 512) + DISC_IMAGE_EDGE_CROP_PX * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.max(
      256,
      Math.min(MAX_FACE_TEXTURE_SIZE, Math.round(displayWidth * dpr)),
    );
    const cacheKey = `${faceSrc}::${size}::${samples}::${blurDegrees}`;
    const cached = blurredFaceCache.get(cacheKey);

    if (cached) {
      setBlurredSrc(cached);
      return;
    }

    let cancelled = false;
    const image = new window.Image();

    // Show the sharp original while the blurred texture is being generated.
    setBlurredSrc(null);

    image.onload = () => {
      if (cancelled) return;

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = Math.max(
        size / image.naturalWidth,
        size / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;

      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1 / samples;

      for (let i = 0; i < samples; i++) {
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.rotate((-i * step * Math.PI) / 180);
        ctx.drawImage(image, x - size / 2, y - size / 2, width, height);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      try {
        const blurred = canvas.toDataURL("image/jpeg", 0.92);
        blurredFaceCache.set(cacheKey, blurred);

        if (blurredFaceCache.size > MAX_BLURRED_FACE_CACHE) {
          const oldest = blurredFaceCache.keys().next().value;
          if (oldest) blurredFaceCache.delete(oldest);
        }

        setBlurredSrc(blurred);
      } catch {
        // Cross-origin artwork taints the canvas; keep the sharp original.
      }
    };

    image.src = faceSrc;

    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [faceSrc, isStopping]);

  // The face starts sharp; the blurred copy fades in with the spin speed.
  const spinAnimationRunning = documentVisible && phase !== "hidden";

  const discRim = isDark
    ? `linear-gradient(145deg, ${grey[900]} 0%, ${grey[600]} 38%, ${grey[900]} 66%, ${grey[700]} 100%)`
    : `linear-gradient(145deg, ${grey[100]} 0%, ${grey[400]} 36%, ${grey[200]} 58%, ${grey[500]} 100%)`;

  const rimHighlight = alpha(white, isDark ? 0.28 : 0.9);
  const isInTray = phase === "entering" || phase === "present";
  /**
   * The cap lifts off the screen as soon as either travel starts and only
   * presses back down once the disc is fully in place (or fully gone), which
   * reads as the spindle releasing/grabbing the disc.
   */
  const hubLifted = phase === "entering" || phase === "leaving";
  const discShadow = theme.shadows[8];

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "1",
        pointerEvents: "none",
      }}
    >
      {/* Static engraved groove around the disc. It is 4 px wider in radius
          than the disc: a dark metallic ring with a light bounce on the lower
          right and a shadow on the upper left. The gradient turns inside a
          static circular clip, so neither edge can shimmer. The opaque tray
          floor below covers the ring's centre and leaves the 4 px ring. */}
      <Box
        sx={{
          position: "absolute",
          inset: `-${DISC_GROOVE_PX}px`,
          borderRadius: "50%",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Box
          ref={grooveRef}
          sx={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? DARK_GROOVE_BACKGROUND
              : LIGHT_GROOVE_BACKGROUND,
            transition: `rotate ${HUB_TILT_MS}ms ease-out`,
            willChange: "rotate",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        />
      </Box>

      {/* Recessed floor inside the groove. It is opaque so it covers the
          centre of the ring, and its own circular edge forms the smooth inner
          boundary of the groove (a rounded clip, not a hard mask edge). */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <Box
          ref={floorRef}
          sx={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? `${DARK_FLOOR_BACKGROUND}, ${theme.palette.section.background}`
              : LIGHT_FLOOR_BACKGROUND,
            transition: `rotate ${HUB_TILT_MS}ms ease-out`,
            willChange: "rotate",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        />
      </Box>

      {/* Moving layer: only the disc travels. The spindle cap is a sibling
          below, pinned to the wrapper, so the disc slides down onto it. */}
      <Box
        data-cd-disc=""
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          // Drop the disc from above the tray without rotating, and send it back
          // up once the player stops. Opacity only parks it out of view: while
          // the disc is leaving it stays fully opaque and simply rides up.
          transform: isInTray ? DISC_RESTING_TRANSFORM : DISC_HIDDEN_TRANSFORM,
          opacity: phase === "hidden" ? 0 : 1,
          transition: isInTray
            ? `transform ${DISC_ENTER_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${DISC_TRAVEL_DELAY_MS}ms, opacity 240ms ease-out`
            : `transform ${DISC_EXIT_MS}ms cubic-bezier(0.55, 0, 0.85, 0.35) ${DISC_TRAVEL_DELAY_MS}ms, opacity 0ms linear`,
          willChange: "transform, opacity",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        }}
      >
        {/* Ambient glow around the disc */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${alpha(
              accent,
              isDark ? 0.35 : 0.22,
            )} 0%, ${alpha(accent, isDark ? 0.18 : 0.12)} 35%, ${alpha(
              accent,
              0.04,
            )} 55%, transparent 75%)`,
            opacity: 0.8,
            pointerEvents: "none",
          }}
        />

        {/* Rim and metallic edge */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: discRim,
            border: `1px solid ${rimHighlight}`,
            boxShadow: discShadow,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: "0.7%",
              borderRadius: "50%",
              border: `1px solid ${rimHighlight}`,
              opacity: 0.55,
              pointerEvents: "none",
            },
          }}
        >
          {/* Static clipping frame. The rotating face is a square whose
            transformed bounding box grows while it spins, so it must be
            clipped here to keep it from extending the page's scrollable
            area (which flickered a horizontal scrollbar). */}
          <Box
            sx={{
              position: "absolute",
              inset: "2.2%",
              borderRadius: "50%",
              overflow: "hidden",
              contain: "paint",
              pointerEvents: "none",
            }}
          >
            {/* Rotating face: the album art and its iridescent treatment */}
            <Box
              ref={faceRef}
              sx={{
                position: "absolute",
                inset: 0,
                transformOrigin: "50% 50%",
                backfaceVisibility: "hidden",
                isolation: "isolate",
                animation: `${spin} ${DISC_SPIN_SECONDS}s linear infinite`,
                animationPlayState: spinAnimationRunning ? "running" : "paused",
                willChange: "transform",
                "@media (prefers-reduced-motion: reduce)": {
                  animation: "none",
                },
              }}
            >
              {/* Sharp face, with the motion-blurred copy crossfading on top as
                the disc spins up. Once the fade finishes only one layer is
                mounted, so the rotating face paints a single texture. */}
              <Box
                sx={{
                  position: "absolute",
                  inset: `-${DISC_IMAGE_EDGE_CROP_PX}px`,
                  pointerEvents: "none",
                }}
              >
                {faceTexture !== "blurred" && (
                  <img
                    src={faceSrc}
                    alt=""
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                {faceTexture !== "sharp" && (
                  <img
                    ref={(node) => {
                      blurredFaceRef.current = node;
                      if (node)
                        node.style.opacity = String(spinRateRef.current);
                    }}
                    src={blurredSrc ?? faceSrc}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </Box>

              {/* All face effects are baked into the rotating layer, so the
              compositor rotates a single texture instead of blending several
              static layers over a moving backdrop. */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `conic-gradient(from 215deg at 50% 50%, transparent 0deg, ${alpha(
                    extra[1],
                    0.32,
                  )} 32deg, ${alpha(white, 0.5)} 60deg, ${alpha(
                    extra[4],
                    0.26,
                  )} 92deg, transparent 132deg, transparent 206deg, ${alpha(
                    extra[2],
                    0.28,
                  )} 246deg, ${alpha(extra[3], 0.24)} 274deg, ${alpha(
                    white,
                    0.38,
                  )} 304deg, transparent 344deg)`,
                  opacity: isDark ? 0.72 : 0.6,
                  pointerEvents: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `radial-gradient(circle at 50% 42%, ${alpha(
                    white,
                    0.32,
                  )} 0%, ${alpha(white, 0.08)} 34%, transparent 62%)`,
                  opacity: 0.55,
                  pointerEvents: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(118deg, transparent 16%, ${alpha(
                    white,
                    0.16,
                  )} 38%, ${alpha(white, 0.38)} 45%, ${alpha(
                    white,
                    0.05,
                  )} 51%, transparent 58%, transparent 72%, ${alpha(
                    white,
                    0.12,
                  )} 86%, transparent 94%)`,
                  opacity: isDark ? 0.75 : 0.6,
                  pointerEvents: "none",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  boxShadow: `inset 0 0 26px ${alpha(
                    black,
                    0.35,
                  )}, inset 0 0 2px ${alpha(white, 0.35)}`,
                  pointerEvents: "none",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Spindle cap: always in its slot, lifting off the screen while the
          disc travels and pressing back down once it has landed. */}
      <CdHub lifted={hubLifted} onTilt={handleTilt} />
    </Box>
  );
};

export default memo(CdDisc);
