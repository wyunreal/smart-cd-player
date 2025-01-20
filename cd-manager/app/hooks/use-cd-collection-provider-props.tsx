import { getCdCollection } from "@/api/cd-collection";
import { Cd } from "@/api/types";
import { useCallback, useEffect, useState } from "react";

export type CdCollectionProps = {
  cds: Cd[] | null;
  refreshCds: () => void;
  getCdById: (id: number) => Cd | null;
};

const useCdCollecitonProviderProps = () => {
  const [cdsCacheVersion, setCdsCacheVersion] = useState(0);
  const [cds, setCds] = useState<Cd[]>([]);
  const refreshCds = useCallback(() => {
    setCdsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getCdCollection().then(setCds);
  }, [cdsCacheVersion]);
  const getCdById = useCallback(
    (id: number) => cds.find((cd) => cd.id === id) || null,
    [cds]
  );

  return { cds, refreshCds, getCdById };
};

export default useCdCollecitonProviderProps;
