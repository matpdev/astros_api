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
          rank: true,
          icon: true,
          fantasyName: true,
          transferFee: true,
          ArtistStyle: {
            include: {
              styles: true,
            },
          },
          ArtistBandType: {
            include: {
              bandType: true,
            },
          },
          UserData: {
            include: {
              Address: true,
            },
          },
        },
      });

      return res.status(200).json(
        artistsData.map((e) => ({
          id: e.id,
          cacheMax: e.cacheMax,
          cacheMin: e.cacheMin,
          rank: e.rank,
          icon: e.icon,
          fantasyName: e.fantasyName,
          ArtistStyle: e.ArtistStyle,
          ArtistBandType: e.ArtistBandType,
          city: e.UserData.Address[0].city,
          distance: 0,
          perKM: e.transferFee,
        }))
      );
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
      let artistsData = await prisma.artist.findMany({
        select: {
          id: true,
          cacheMax: true,
          cacheMin: true,
          rank: true,
          icon: true,
          fantasyName: true,
          Dates: true,
          UserData: {
            include: {
              Address: true,
            },
          },
          ArtistStyle: {
            include: {
              styles: true,
            },
          },
          ArtistBandType: {
            include: {
              bandType: true,
            },
          },
        },
      });

      if (lat && long) {
        artistsData = artistsData.map((x) => ({
          ...x,
          distance: calculateDistance({
            lat1: lat,
            long1: long,
            lat2: x.UserData.Address[0].lat,
            long2: x.UserData.Address[0].long,
          }),
        }));
      }

      if (city) {
        artistsData = artistsData.filter(
          (x) => x.UserData.Address[0].city == city && x
        );
      }

      if (uf) {
        artistsData = artistsData.filter(
          (x) => x.UserData.Address[0].state == uf && x
        );
      }

      if (styles) {
        let data = [];
        artistsData.filter((x) => {
          x.ArtistStyle.map((y) => {
            styles.map((j) => {
              if (j == y.style) {
                data.push(x);
              }
            });
          });
        });

        artistsData = data;
      }

      if (categories) {
        let data = [];
        artistsData.filter((x) => {
          x.ArtistBandType.map((y) => {
            categories.map((j) => {
              if (j == y.style && x.ArtistBandType.length > 0) {
                data.push(x);
              }
            });
          });
        });

        artistsData = data;
      }

      if (dates) {
        let data = [];
        artistsData.map((x) => {
          dates.map((y) => {
            x.Dates.map((h) => {
              y == h.date && h.isFree == true && data.push(x);
            });
          });
        });
        artistsData = data;
      }

      if (search) {
        artistsData = artistsData.filter((x) => {
          return x.fantasyName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(
              search
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            );
        });
      }

      if (sort) {
        artistsData = artistsData.sort((a, b) =>
          sort == 0
            ? 0
            : sort == 1
            ? a.distance > b.distance
              ? -1
              : 1
            : a.distance < b.distance
            ? -1
            : 1
        );
      }

      if (hourStart) {
        let dataChanged = [];
        artistsData.map((x) => {
          moment(`2023-01-01 ${x.Dates[0].hourMin}`) >=
            moment(`2023-01-01 ${hourStart}`) && dataChanged.push(x);
        });
        artistsData = dataChanged;
      }

      return res.send(
        artistsData.filter((x) => {
          if (x.distance >= minDistance && x.distance <= maxDistance) return x;
        })
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
        const userData = await prisma.artist.findFirst({
          where: {
            userId: decoded.id,
          },
        });

        if (!!userData) {
          await prisma.dates.create({
            data: {
              isFree,
              date: date,
              hourMin,
              artistId: userData.id,
            },
          });
          res.send("Adicionado Com Sucesso");
        } else {
          res.status(403).json({ Code: 403, Message: "Sem Permissão" });
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

      const userData = await prisma.artist.findFirst({
        where: {
          userId: decoded.id,
        },
      });

      if (userData) {
        await prisma.extras.create({
          data: {
            name,
            value,
            description,
            artistId: userData.id,
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
          Extras: true,
        },
      });

      if (artist?.Extras) {
        return res.json(artist.Extras);
      } else {
        return res.status(404).send("Artista não encontrado");
      }
    });
  });

  app.get("/artist/:id", async (req, res) => {
    const { id } = req.params;
    try {
      let artistsData = await prisma.artist.findUnique({
        where: {
          id: +id,
        },
        include: {
          User: {
            select: {
              name: true,
              email: true,
              roleTypeId: true,
            },
          },
          UserData: {
            include: {
              Address: true,
            },
          },
          ArtistBandType: {
            include: {
              bandType: true,
            },
          },
          ArtistStyle: {
            include: {
              styles: true,
            },
          },
          ArtistType: true,
          Dates: true,
          Extras: true,
        },
      });

      return res.json(artistsData);
    } catch (e) {
      console.log(e);
      return res.status(400).json(e);
    }
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
