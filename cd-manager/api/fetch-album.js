const { fetchMatchesList } = require("./fetch-album-matches");
const { fetchAlbumDetails } = require("./fetch-album-details");

function fetchAlbumData(cdidList) {
  return new Promise((resolve, reject) => {
    const cdid = cdidList.shift();
    fetchAlbumDetails(cdid)
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
}

function fetchAlbum(artistName, albumName, trackCount) {
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
}

module.exports = { fetchAlbum };
