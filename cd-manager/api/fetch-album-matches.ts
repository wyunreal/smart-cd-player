import http from "http";
import { CdKey } from "./types";

const isTitleCase = (str: string, allWordsStartingWithUpperCase = false) => {
  const words = str.split(" ");
  return words.every((word, index) => {
    if (word.length === 0) return false;
    if (
      (index === 0 || allWordsStartingWithUpperCase) &&
      word[0] !== word[0].toUpperCase()
    )
      return false;
    for (let i = 1; i < word.length; i++) {
      if (word[i] !== word[i].toLowerCase()) return false;
    }
    return true;
  });
};

const getMatchEntries = (text: string) => {
  return text.split("\n").map((line) => {
    const [keyword, cdid, ...payload] = line.split(" ");
    if (keyword === "data") {
      const [artist, album] = payload
        .join(" ")
        .split("/")
        .map((part) => part.trim());
      return {
        cdid,
        artist,
        album,
      };
    }
  });
};

const fetchMatchesList = async (
  artistName: string,
  albumName: string,
  trackCount: number,
  seed: string
): Promise<CdKey[]> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "gnudb.gnudb.org",
      port: 80,
      path: `/~cddb/cddb.cgi?cmd=search&artist=${encodeURIComponent(
        artistName
      )}&album=${encodeURIComponent(
        albumName
      )}&tracks=${trackCount}&hello=${seed}`,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const matches = getMatchEntries(data).filter(
          (match) =>
            match != undefined &&
            match.artist.length === artistName.length &&
            match.album.length === albumName.length &&
            (isTitleCase(match.artist) || isTitleCase(match.artist, true))
        );

        resolve(matches.filter((match) => match !== undefined) as CdKey[]);
      });
    });

    req.on("error", (e) => {
      reject(`Problem with request: ${e.message}`);
    });

    req.end();
  });
};

export default fetchMatchesList;
