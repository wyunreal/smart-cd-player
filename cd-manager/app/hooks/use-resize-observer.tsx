import { useEffect, useState } from "react";

const useResizeObserver = () => {
  const [height, setHeight] = useState(0);
  const [width, setWidth] = useState(0);

  const [contentRef, setContentRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setHeight(contentRef ? contentRef.offsetHeight : 0);
      setWidth(contentRef ? contentRef.offsetWidth : 0);
    });
    if (contentRef) {
      resizeObserver.observe(contentRef);
      return () => {
        resizeObserver.disconnect();
      };
    }
  });

  return {
    width,
    height,
    resizeRef: (contentRef: HTMLDivElement | null) => {
      setContentRef(contentRef);
    },
  };
};

export default useResizeObserver;
