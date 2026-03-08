import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.COMPOSITE_VIDEO_PARSER_URL;

  if (!baseUrl) {
    return NextResponse.json(
      { error: "COMPOSITE_VIDEO_PARSER_URL not configured" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${baseUrl}/display`);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Display proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch display state", details: errorMessage },
      { status: 500 },
    );
  }
}
