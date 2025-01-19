import { getCdCollection } from "@/api/cd-collection";
import { Cd } from "@/api/types";
import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

type DataRepositoryContextProps = {
  cds: Cd[] | null;
  refreshCds: () => void;
  getCdById: (id: string) => Cd | null;
};

export const DataRepositoryContext = createContext<DataRepositoryContextProps>({
  cds: null,
  refreshCds: () => {},
  getCdById: () => null,
});

const useCds = () => {
  const [cdsCacheVersion, setCdsCacheVersion] = useState(0);
  const [cds, setCds] = useState<Cd[]>([]);
  const refreshCds = useCallback(() => {
    setCdsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getCdCollection().then(setCds);
  }, [cdsCacheVersion]);
  const getCdById = useCallback(
    (id: string) => cds.find((cd) => cd.id === id) || null,
    [cds]
  );

  return { cds, refreshCds, getCdById };
};

export const DataRepositoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { cds, refreshCds, getCdById } = useCds();
  return (
    <DataRepositoryContext.Provider value={{ cds, refreshCds, getCdById }}>
      {children}
    </DataRepositoryContext.Provider>
  );
};
