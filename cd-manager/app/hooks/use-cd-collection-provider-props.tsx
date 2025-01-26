import { getCdCollection } from "@/api/cd-collection";
import { Cd } from "@/api/types";
import { useCallback, useEffect, useState } from "react";

export type CdCollectionProps = {
  cds: { [id: number]: Cd } | null;
  refreshCds: () => void;
  getCdById: (id: number) => Cd | null;
};

const useCdCollectionProviderProps = () => {
  const [cdsCacheVersion, setCdsCacheVersion] = useState(0);
  const [cds, setCds] = useState<{ [id: number]: Cd }>({});
  const refreshCds = useCallback(() => {
    setCdsCacheVersion((v) => v + 1);
  }, []);
  useEffect(() => {
    getCdCollection().then((cds) => {
      const cdsById = cds.reduce(
        (acc, cd) => {
          acc[cd.id] = cd;
          return acc;
        },
        {} as { [id: number]: Cd }
      );
      setCds(cdsById);
    });
  }, [cdsCacheVersion]);
  const getCdById = useCallback((id: number) => cds[id] || null, [cds]);

  return { cds, refreshCds, getCdById };
};

export default useCdCollectionProviderProps;
