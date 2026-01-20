import dotenv from "dotenv";
import searchByBarCode from "../api/discogs";

// Load environment variables
dotenv.config({ path: ".env.local" });

const [, , barcode] = process.argv;

const fetchAlbumData = async (barcode: string) => {
  if (!barcode) {
    console.error("Error: You must provide a barcode");
    console.log("Usage: npx tsx scripts/test-get-album.ts [BARCODE]");
    console.log("Example: npx tsx scripts/test-get-album.ts 602527347523");
    process.exit(1);
  }

  try {
    console.log(`Searching for album with barcode: ${barcode}...`);
    const albumData = await searchByBarCode(barcode);

    if (albumData) {
      console.log("\n✓ Album found:");
      console.log(`Title: ${albumData.title}`);
      console.log(`Artist: ${albumData.artist}`);
      console.log(`Year: ${albumData.year || "N/A"}`);
      console.log(`Genre: ${albumData.genre}`);
      console.log(`Tracks: ${albumData.tracks.length}`);

      if (albumData.art?.allImages && albumData.art.allImages.length > 0) {
        console.log("\nAll Images:");
        albumData.art.allImages.forEach((img, index) => {
          console.log(
            `  [${index}] Type: ${img.type} | Size: ${img.width}x${img.height}`,
          );
          console.log(`      Full: ${img.uri}`);
          console.log(`      150px: ${img.uri150}`);
        });
      } else {
        console.log("\nImages: None available");
      }

      console.log("\nFull JSON:");
      console.log(JSON.stringify(albumData, null, 2));
    } else {
      console.log("\n✗ No album found with that barcode");
    }
  } catch (error) {
    console.error("Error searching for album:", error);
  }
};

(async () => {
  await fetchAlbumData(barcode);
})();
