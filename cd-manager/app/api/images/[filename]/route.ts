import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { FILES_DIR } from "@/api/file-storage";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) => {
  const { filename } = await params;

  const filePath = path.join(FILES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return Response.json({ error: "Image not found" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();

  const contentTypeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };

  const contentType = contentTypeMap[ext] || "application/octet-stream";

  const stats = fs.statSync(filePath);
  const etag = `"${stats.size}-${stats.mtimeMs}"`;

  return new Response(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "Last-Modified": stats.mtime.toUTCString(),
    },
  });
};
