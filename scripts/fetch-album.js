const { fetchAlbum } = require("../fetch-album");

const artistName = process.argv[2];
const albumName = process.argv[3];
const trackCount = parseInt(process.argv[4], 10);

fetchAlbum(artistName, albumName, trackCount)
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error(error);
  });
