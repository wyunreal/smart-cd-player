import { migrateImages } from "@/api/cd-collection";

export const POST = async () => {
  try {
    const migratedCount = await migrateImages();
    return Response.json({ migratedCount });
  } catch (error) {
    console.error("Image migration failed:", error);
    return Response.json(
      { error: "Image migration failed" },
      { status: 500 },
    );
  }
};
