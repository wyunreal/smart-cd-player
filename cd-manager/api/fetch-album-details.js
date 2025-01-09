const http = require("http");

const getTitle = (title) => {
  return title.split(" / ")[1];
};

const getArtist = (title) => {
  return title.split(" / ")[0];
};

const getAlbumData = (text) => {
  return text.split("\r\n").reduce((acc, line) => {
    if (!line.startsWith("#") && line.includes("=")) {
      const separatorPosition = line.indexOf("=");
      const paramName = line.slice(0, separatorPosition);
      const paramValue = line.slice(separatorPosition + 1);
      switch (paramName) {
        case "DTITLE":
          return {
            ...acc,
            title: getTitle(paramValue),
            artist: getArtist(paramValue),
          };
        case "DYEAR":
          return { ...acc, year: paramValue };
        case "DGENRE":
          return { ...acc, genre: paramValue };
        default: {
          if (paramName.startsWith("TTITLE")) {
            const trackNumber = paramName.slice(6);
            return {
              ...acc,
              tracks: [
                ...(acc.tracks ? acc.tracks : []),
                { number: Number(trackNumber) + 1, title: paramValue },
              ],
            };
          }
        }
      }
    }
    return acc;
  }, {});
};

function fetchAlbumDetails(cdid) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "gnudb.gnudb.org",
      port: 80,
      path: `/~cddb/cddb.cgi?cmd=cddb+read+soundtrack+${cdid}&hello=wiljan+arias`,
      method: "GET",
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const albumData = getAlbumData(data);
        if (albumData.title) {
          resolve(albumData);
        } else {
          reject(`No data found for ${cdid}`);
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
}

module.exports = {
  fetchAlbumDetails,
};
