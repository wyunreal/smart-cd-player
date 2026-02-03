import { useCallback, useEffect, useRef, useState } from "react";

const useResizeObserver = () => {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const resizeRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;

    // Limpiar el observer anterior
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    if (node) {
      const handleResize = (entries: ResizeObserverEntry[]) => {
        if (!entries[0]) return;

        // Cancelar cualquier actualización pendiente
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        // Usar requestAnimationFrame para batch las actualizaciones
        rafRef.current = requestAnimationFrame(() => {
          const { height: newHeight, width: newWidth } = entries[0].contentRect;
          const roundedHeight = Math.round(newHeight);
          const roundedWidth = Math.round(newWidth);

          setHeight((prev) => (prev !== roundedHeight ? roundedHeight : prev));
          setWidth((prev) => (prev !== roundedWidth ? roundedWidth : prev));
        });
      };

      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(node);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    width,
    height,
    resizeRef,
  };
};

export default useResizeObserver;
