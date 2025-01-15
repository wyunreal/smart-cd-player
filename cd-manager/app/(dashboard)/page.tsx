"use client";

import React, { Suspense, useState } from "react";
import { Cd } from "@/api/types";
import { getCdCollection } from "@/api/cd-collection";
import CdCollection from "../components/CdCollection";

export default () => {
  const [cds, setCds] = useState<Cd[]>();
  React.useEffect(() => {
    getCdCollection().then((collection) => {
      setCds(collection);
      console.log(collection);
    });
  }, []);
  return (
    <Suspense fallback={<>Loading</>}>
      <CdCollection cds={cds || []} />
    </Suspense>
  );
};
