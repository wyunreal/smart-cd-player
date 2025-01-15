"use server";

import { getCdCollection } from "@/api/cd-collection";
import React from "react";
import CdCollection from "../components/CdCollection";

const WithCds = async () => {
  const cds = await getCdCollection();
  return <CdCollection cds={cds} />;
};

export default WithCds;
