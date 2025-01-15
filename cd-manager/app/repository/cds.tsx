import React from "react";
import { getCdCollection } from "@/api/cd-collection";
import CdCollection from "../components/CdCollection";

const Cds = async () => {
  const cds = await getCdCollection();
  return <CdCollection cds={cds || []} />;
};

export default Cds;
