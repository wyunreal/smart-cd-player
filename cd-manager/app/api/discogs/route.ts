import searchByBarCode from "@/api/discogs";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const barcode = searchParams.get("barcode");

  if (!barcode) {
    return Response.json(
      { error: "Barcode parameter is required" },
      { status: 400 },
    );
  }

  try {
    const result = await searchByBarCode(barcode);

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Error searching CD by barcode:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
