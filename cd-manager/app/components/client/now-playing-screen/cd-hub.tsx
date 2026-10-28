"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import CompactDiskAudioLogo from "./compact-disk-audio-logo";

/**
 * Static spindle cap in the middle of the disc. It uses the brushed aluminium
 * texture supplied for the project and carries the Compact Disc mark in black
 * directly on the metal, without a plaque or background.
 */
const HUB_VISIBLE_THRESHOLD = 0.7;

/**
 * Visible fraction of the circular hub (not its square box). The cap is a
 * circle, so clipping at the top removes a circular segment, not a rectangle.
 */
const visibleCircleRatio = (
  hub: DOMRect,
  clipTop: number,
  clipBottom: number,
) => {
  const diameter = hub.height;
  const radius = diameter / 2;
  const y1 = Math.max(0, clipTop - hub.top);
  const y2 = Math.min(diameter, clipBottom - hub.top);

  if (y2 <= y1 || radius <= 0) return 0;

  const areaAt = (y: number) => {
    const x = y - radius;
    const root = Math.sqrt(Math.max(0, radius * radius - x * x));
    const angle = Math.asin(Math.max(-1, Math.min(1, x / radius)));
    return x * root + radius * radius * angle;
  };

  return (areaAt(y2) - areaAt(y1)) / (Math.PI * radius * radius);
};

const CdHub = () => {
  const hubRef = useRef<HTMLDivElement | null>(null);
  const [logoVisible, setLogoVisible] = useState(false);

  // In the stacked layout the disc can be cropped by the top of the content
  // area. Keep the mark while at least 70% of the circular hub is visible.
  useEffect(() => {
    const hub = hubRef.current;
    const root = hub?.closest("main");
    const disc = hub?.closest<HTMLElement>("[data-cd-disc]");
    if (!hub || !root) return;

    const update = () => {
      const hubRect = hub.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const clipTop = rootRect.top + root.clientTop;
      const clipBottom = clipTop + root.clientHeight;

      setLogoVisible(
        visibleCircleRatio(hubRect, clipTop, clipBottom) >=
          HUB_VISIBLE_THRESHOLD,
      );
    };

    let cancelled = false;
    const safeUpdate = () => {
      if (!cancelled) update();
    };

    // The disc slides in/out with a transform, which does not resize the hub
    // nor trigger a window resize. Re-measure once the movement settles.
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (event.target === disc) safeUpdate();
    };

    // Layout also settles after fonts and the first paint.
    const frame = requestAnimationFrame(safeUpdate);
    document.fonts?.ready.then(safeUpdate).catch(() => {});

    update();

    const observer = new ResizeObserver(safeUpdate);
    observer.observe(hub);
    observer.observe(root);

    // Reduced motion removes the transition, so no transitionend fires when
    // the disc jumps into place. Emotion changes the class when its phase
    // changes, so watch that as well.
    let discObserver: MutationObserver | null = null;
    if (disc) {
      discObserver = new MutationObserver(safeUpdate);
      discObserver.observe(disc, {
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    disc?.addEventListener("transitionend", handleTransitionEnd);
    disc?.addEventListener("transitioncancel", handleTransitionEnd);
    root.addEventListener("scroll", safeUpdate, { passive: true });
    window.addEventListener("resize", safeUpdate);
    window.addEventListener("load", safeUpdate);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      discObserver?.disconnect();
      disc?.removeEventListener("transitionend", handleTransitionEnd);
      disc?.removeEventListener("transitioncancel", handleTransitionEnd);
      root.removeEventListener("scroll", safeUpdate);
      window.removeEventListener("resize", safeUpdate);
      window.removeEventListener("load", safeUpdate);
    };
  }, []);

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Box
        ref={hubRef}
        sx={{
          width: "32%",
          aspectRatio: "1",
          borderRadius: "50%",
          backgroundImage: 'url("/mock/cd-hub-texture.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow:
            "0 9px 18px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "50%",
            lineHeight: 0,
            opacity: logoVisible ? 1 : 0,
            transition: "opacity 380ms ease-in-out",
            willChange: "opacity",
            filter:
              "brightness(0) drop-shadow(0 0 1.5px rgba(255,255,255,0.6)) drop-shadow(0 0 4px rgba(255,255,255,0.22))",
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
          }}
        >
          <CompactDiskAudioLogo />
        </Box>
      </Box>
    </Box>
  );
};

export default CdHub;
