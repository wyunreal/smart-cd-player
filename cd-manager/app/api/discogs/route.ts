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
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a rate limit or timeout error (timeout is usually caused by rate limit)
    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("timeout")
    ) {
      return Response.json(
        { error: "Discogs API rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    return Response.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 },
    );
  }
};
