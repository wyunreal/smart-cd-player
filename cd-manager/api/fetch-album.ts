import fetchMatchesList from "./fetch-album-matches";
import fetchAlbumDetails from "./fetch-album-details";
import { Cd } from "./types";

const fetchAlbumData = async (cdidList: string[]): Promise<Cd> => {
  if (cdidList.length === 0) {
    return Promise.reject("Empty cd id list");
  }
  return new Promise((resolve, reject) => {
    const cdid = cdidList.shift();
    fetchAlbumDetails(cdid || "")
      .then((data) => {
        if (data) {
          resolve(data);
        } else if (cdidList.length > 0) {
          fetchAlbumData(cdidList).then(resolve);
        } else {
          reject();
        }
      })
      .catch(() => fetchAlbumData(cdidList).then(resolve));
  });
};

const fetchAlbum = async (
  artistName: string,
  albumName: string,
  trackCount: number
): Promise<Cd> => {
  return new Promise((resolve, reject) => {
    fetchMatchesList(artistName, albumName, trackCount)
      .then((matches) => {
        if (matches.length === 0) {
          reject(`No matches found for ${artistName} - ${albumName}`);
          return;
        }
        fetchAlbumData(matches.map((match) => match.cdid))
          .then((data) => {
            if (data) {
              resolve(data);
            } else {
              reject(`No matches found for ${artistName} - ${albumName}`);
            }
          })
          .catch(reject);
      })
      .catch(reject);
  });
};

module.exports = { fetchAlbum };
