import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(targetUrl);

    // Forward the status and statusText
    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    // Determine content type (default to json if not specified, but could be text)
    // The player client expects JSON for commands, but maybe text for emit?
    // Let's forward the body as text or json based on content-type header?
    // Actually, client.ts expects json for "commands" and doesn't care about body for "emit" (just ok).
    // Let's just return the body as is.

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/json",
        "Access-Control-Allow-Origin": "*", // Optional since it's same-origin now
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to fetch remote url",
        details: errorMessage,
        debug: "v4-root-test",
      },
      {
        status: 500,
        headers: { "X-Debug-Version": "v4" },
      },
    );
  }
}
