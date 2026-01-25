import dotenv from "dotenv";
import { searchByBarCode } from "../api/discogs/client";

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
    const result = await searchByBarCode(barcode);

    if (result.rateLimit) {
      console.log(
        `\nRate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit} requests remaining\n`,
      );
    }

    if (result.cds.length > 0) {
      console.log(`✓ Found ${result.cds.length} album(s):\n`);

      console.log(`${"─".repeat(120)}`);
      console.log(
        `${"#".padEnd(4)} | ${"Artist".padEnd(25)} | ${"Title".padEnd(30)} | ${"Year".padEnd(6)} | ${"Genre".padEnd(15)} | ${"Tracks".padEnd(8)} | ${"Images".padEnd(8)}`,
      );
      console.log(`${"─".repeat(120)}`);

      result.cds.forEach((albumData, idx) => {
        const artist = albumData.artist.substring(0, 25).padEnd(25);
        const title = albumData.title.substring(0, 30).padEnd(30);
        const year = (albumData.year || "N/A").toString().padEnd(6);
        const genre = albumData.genre.substring(0, 15).padEnd(15);
        const tracks = albumData.tracks.length.toString().padEnd(8);
        const images = (albumData.art?.allImages?.length || 0)
          .toString()
          .padEnd(8);

        console.log(
          `${(idx + 1).toString().padEnd(4)} | ${artist} | ${title} | ${year} | ${genre} | ${tracks} | ${images}`,
        );
      });

      console.log(`${"─".repeat(120)}`);
    } else {
      console.log("\n✗ No albums found with that barcode");
    }
  } catch (error) {
    console.error("Error searching for album:", error);
  }
};

(async () => {
  await fetchAlbumData(barcode);
})();
