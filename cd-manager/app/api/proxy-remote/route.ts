import { NextRequest, NextResponse } from "next/server";
import { isAllowedProxyUrl } from "@/lib/security";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  if (!isAllowedProxyUrl(targetUrl)) {
    return NextResponse.json(
      { error: "URL not allowed" },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote error: ${response.status} ${response.statusText}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch remote url" },
      { status: 500 },
    );
  }
}
