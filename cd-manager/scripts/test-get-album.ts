import fetchAlbum from "../api/fetch-album";

const [, , artist, album, tracks] = process.argv;

fetchAlbum(artist, album, Number(tracks))
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error(error);
  });
