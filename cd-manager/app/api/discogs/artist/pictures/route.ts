import { getArtistPicturesByName } from "@/api/discogs";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artistName = searchParams.get("artistName");

    if (!artistName) {
      return NextResponse.json(
        { error: "Artist name is required" },
        { status: 400 },
      );
    }

    const result = await getArtistPicturesByName(artistName);

    if (!result) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching artist pictures:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("timeout")
    ) {
      return NextResponse.json(
        { error: "Discogs API rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 },
    );
  }
}
