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
};

export const DataRepositoryContext = createContext<DataRepositoryContextProps>({
  cds: null,
  refreshCds: () => {},
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

  return { cds, refreshCds };
};

export const DataRepositoryProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { cds, refreshCds } = useCds();
  return (
    <DataRepositoryContext.Provider value={{ cds, refreshCds }}>
      {children}
    </DataRepositoryContext.Provider>
  );
};
