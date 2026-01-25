"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface CdSelectionContextType {
  selectedCdId: number | null;
  selectCdById: (id: number | null) => void;
  clearSelection: () => void;
}

const CdSelectionContext = createContext<CdSelectionContextType>({
  selectedCdId: null,
  selectCdById: () => {},
  clearSelection: () => {},
});

export const useCdSelection = () => useContext(CdSelectionContext);

interface CdSelectionProviderProps {
  children: ReactNode;
}

export const CdSelectionProvider = ({ children }: CdSelectionProviderProps) => {
  const [selectedCdId, setSelectedCdId] = useState<number | null>(null);

  const selectCdById = useCallback((id: number | null) => {
    setSelectedCdId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCdId(null);
  }, []);

  return (
    <CdSelectionContext.Provider
      value={{
        selectedCdId,
        selectCdById,
        clearSelection,
      }}
    >
      {children}
    </CdSelectionContext.Provider>
  );
};
