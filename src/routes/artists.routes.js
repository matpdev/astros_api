require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const moment = require("moment");
const { calculateDistance } = require("../utils/utils");
const prisma = new PrismaClient(),
  nodemailer = require("nodemailer");

module.exports = function (app) {
  app.get("/artists", async (req, res) => {
    try {
      const artistsData = await prisma.artist.findMany({
        select: {
          id: true,
          cacheMax: true,
          cacheMin: true,
          lat: true,
          long: true,
          rank: true,
          city: true,
          number: true,
          address: true,
          district: true,
          uf: true,
          icon: true,
          type: true,
          style: true,
        },
      });

      return res.status(200).json(artistsData);
    } catch (e) {
      console.log(e);
      return res.send(e);
    }
  });

  app.post("/artists/search", async (req, res) => {
    const {
      lat,
      long,
      search,
      sort,
      styles,
      categories,
      dates,
      hourStart,
      hourEnd,
      minDistance,
      maxDistance,
      city,
      uf,
    } = req.body;

    try {
      let dataChanged = [];
      let artistsData = await prisma.artist.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          fantasyName: true,
          cacheMax: true,
          cacheMin: true,
          lat: true,
          long: true,
          rank: true,
          city: true,
          number: true,
          address: true,
          district: true,
          uf: true,
          icon: true,
          type: true,
          style: true,
          dates: {
            select: {
              date: true,
              isFree: true,
              hourMin: true,
            },
          },
        },
      });

      if (styles) {
        dataChanged = [];
        artistsData.map((x, i) => {
          styles.map((y) => {
            x.style.map((c) => {
              if (c.id == y) {
                dataChanged.push(x);
              } else {
                dataChanged.map((d, g) => {
                  d.style.map((h) => {
                    h.id != y && dataChanged.splice(g, 1);
                  });
                });
              }
            });
          });
        });

        artistsData = dataChanged;
      }

      if (categories) {
        dataChanged = [];
        artistsData.map((x) => {
          categories.map((y) => {
            x.type.map((c) => {
              if (c.id == y) {
                dataChanged.push(x);
              } else {
                dataChanged.map((d, g) => {
                  d.type.map((h) => {
                    h.id != y && dataChanged.splice(g, 1);
                  });
                });
              }
            });
          });
        });

        artistsData = dataChanged;
      }

      if (dates) {
        dataChanged = [];
        artistsData.map((x) => {
          dates.map((y) => {
            x.dates.some((h) => {
              h?.date == y && dataChanged.push(x);
            });
          });
        });
        artistsData = dataChanged;
      }

      if (hourStart && hourEnd) {
        dataChanged = [];
        artistsData.map((x) => {
          moment(`2023-01-01 ${x.dates[0].hourMin}`) >=
            moment(`2023-01-01 ${hourStart}`) &&
            moment(`2023-01-01 ${x.dates[0].hourMin}`) <=
              moment(`2023-01-01 ${hourEnd}`) &&
            dataChanged.push(x);
        });
        artistsData = dataChanged;
      }

      return res.status(200).json(
        artistsData
          .filter((x) =>
            x.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .includes(
                search
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
              )
          )
          .map((x) => ({
            ...x,
            distance: calculateDistance({
              lat1: x.lat,
              long1: x.long,
              lat2: lat,
              long2: long,
            }),
          }))
          .filter((x) => (city ? x.city == city && x : x))
          .filter((x) => (uf ? x.uf == uf && x : x))
          .filter((x) =>
            maxDistance != null && minDistance != null
              ? x.distance >= minDistance && x.distance <= maxDistance && x
              : x
          )
          .sort((a, b) =>
            sort == 0
              ? 0
              : sort == 1
              ? a.distance > b.distance
                ? -1
                : 1
              : a.distance < b.distance
              ? -1
              : 1
          )
      );
    } catch (e) {
      console.log(e);
      return res.send(e);
    }
  });

  app.post("/artist/date", async (req, res) => {
    const { date, hourMin, isFree } = req.body;

    if (!req.headers.authorization) {
      return res.status(403).send({
        message: "Sem autorização!",
      });
    }

    let newAuthorization = req.headers.authorization.substring(
      7,
      req.headers.authorization.length
    );

    try {
      jwt.verify(newAuthorization, process.env.SECRET, async (err, decoded) => {
        const userData = await prisma.user.findUnique({
          where: {
            id: decoded.id,
          },
          include: {
            artist: true,
          },
        });

        console.log(userData);

        if (!!userData.artistId) {
          await prisma.dates.create({
            data: {
              isFree,
              date: date,
              hourMin,
              artistId: userData.artistId,
            },
          });
          res.send("Adicionado Com Sucesso");
        } else {
          res.status(403).send("Sem Permissão");
        }
      });
    } catch (e) {
      return res.json(e);
    }
  });

  app.post("/artist/extra", async (req, res) => {
    const { name, value, description } = req.body;
    if (!req.headers.authorization) {
      return res.status(403).send({
        message: "Sem autorização!",
      });
    }

    let newAuthorization = req.headers.authorization.substring(
      7,
      req.headers.authorization.length
    );

    jwt.verify(newAuthorization, process.env.SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Sem autorização!",
        });
      }

      const artist = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        include: {
          artist: true,
        },
      });

      if (artist.artist != null) {
        await prisma.extras.create({
          data: {
            name,
            value,
            description,
            artistId: artist.artistId,
          },
        });

        return res.send("Extra Adicionado com Sucesso");
      } else {
        return res.status(404).send("Artista não encontrado");
      }
    });
  });

  app.get("/artist/extra/:id", async (req, res) => {
    const { id } = req.params;
    if (!req.headers.authorization) {
      return res.status(403).send({
        message: "Sem autorização!",
      });
    }

    let newAuthorization = req.headers.authorization.substring(
      7,
      req.headers.authorization.length
    );

    jwt.verify(newAuthorization, process.env.SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).send({
          message: "Sem autorização!",
        });
      }

      const artist = await prisma.artist.findUnique({
        where: {
          id: +id,
        },
        include: {
          extras: true,
        },
      });

      if (artist?.extras) {
        return res.json(artist.extras);
      } else {
        return res.status(404).send("Artista não encontrado");
      }
    });
  });

  // app.get("/artists/contrast", async (req, res) => {
  //   try {
  //     const userData = await prisma.artist.findMany({});

  //     //   if (!!userData.artistId) {
  //     //     await prisma.dates.create({
  //     //       data: {
  //     //         isFree,
  //     //         date: date,
  //     //         hourMin,
  //     //         artistId: userData.artistId,
  //     //       },
  //     //     });
  //     res.json(userData);
  //     //   } else {
  //     //     res.status(403).send("Sem Permissão");
  //     //   }
  //   } catch (e) {
  //     return res.json(e);
  //   }
  // });
};

// res.json({
//   date,
//   hourMin,
//   mom: moment(date + " " + hourMin).isSameOrAfter(moment()),
// });

// um = new Date("2023-01-18 12:14:17")
// um = new Date(Date.UTC(um.getFullYear(), um.getMonth(), um.getDate(), um.getHours(), um.getMinutes(), um.getSeconds()))

// console.log(um.toLocaleString("pt-br", {timeZone: "America/Sao_Paulo"}))
