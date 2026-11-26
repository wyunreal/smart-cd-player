"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CdListDrawerContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CdListDrawerContext = createContext<CdListDrawerContextValue>({
  open: false,
  setOpen: () => {},
});

export const CdListDrawerProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The drawer belongs to the Now Playing view. Close it when navigating away.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <CdListDrawerContext.Provider value={value}>
      {children}
    </CdListDrawerContext.Provider>
  );
};

export const useCdListDrawer = () => useContext(CdListDrawerContext);
