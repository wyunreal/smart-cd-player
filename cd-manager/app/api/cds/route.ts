import { getCdCollection } from "@/api/cd-collection";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const cds = await getCdCollection();
  return Response.json({ cds });
};
