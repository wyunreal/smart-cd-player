import { addCd, getCdCollection } from "@/api/cd-collection";
import { Cd } from "@/api/types";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  const cds = await getCdCollection();
  return Response.json({ cds });
};

export const POST = async (request: NextRequest) => {
  try {
    const cd: Cd = await request.json();
    const newId = await addCd(cd);
    return Response.json({ success: true, id: newId }, { status: 201 });
  } catch (error) {
    console.error("Error adding CD:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 },
    );
  }
};
