require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

module.exports = function (app) {
  app.put("/user", async (req, res) => {
    const { firstName, lastName, imageIcon, document, clientId } = req.body;
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
      const userData = await prisma.user.update({
        data: {
          firstName,
          lastName,
          imageIcon,
        },
        where: {
          id: decoded.id,
        },
      });
      if (userData) {
        return res.status(200).json(userData);
      } else {
        return res
          .status(200)
          .json({ Message: "Usuário não encontrado", Code: "404" });
      }
    });
  });

  app.post("/user/makeartist", async (req, res) => {
    const {
      document,
      documentType,
      description,
      fantasyName,
      transferFee,
      cacheMin,
      cacheMax,
      lat,
      long,
      icon,
      type,
      style,

      account,
      agency,
      bank,
      account_type,

      instagramLink,
      facebookLink,
      tikTokLink,
      spotifyLink,
      websiteLink,
      youtubeLink,

      artistTypeId,
      isAccepting,

      state,
      city,
      district,
      address,
      number,
      zipcode,

      birthDate,
      openingYear,
      imageIcon,
      gender,
      houseCapacity,
    } = req.body;

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
      const artist = await prisma.artist.findFirst({
        where: {
          userId: decoded.id,
        },
      });
      if (!artist) {
        const userData = await prisma.userData.create({
          data: {
            birthDate,
            description,
            openingYear,
            imageIcon,
            gender,
            houseCapacity: +houseCapacity,
          },
        });

        const addressData = await prisma.address.create({
          data: {
            id: userData.id,
            lat: +lat,
            long: +long,
            state,
            city,
            district,
            address,
            number,
            zipcode,
          },
        });

        const artistData = await prisma.artist.create({
          data: {
            document,
            documentType,
            transferFee: +transferFee,
            fantasyName,
            facebookLink,
            instagramLink,
            tikTokLink,
            spotifyLink,
            websiteLink,
            youtubeLink,
            cacheMin: +cacheMin,
            cacheMax: +cacheMax,
            icon,
            artistTypeId: artistTypeId,
            account,
            agency,
            bank,
            account_type,
            userId: decoded.id,
            userDataId: userData.id,
            isAccepting: true,
          },
          include: {
            User: {
              select: {
                email: true,
                id: true,
                roleTypeId: true,
                phone: true,
                name: true,
              },
            },
            UserData: {
              include: {
                Address: true,
              },
            },
          },
        });

        if (style) {
          for (let i = 0; i < style.length; i++) {
            await prisma.artistStyle.create({
              data: {
                artistId: artistData.id,
                style: style[i],
              },
            });
          }
        }

        if (type) {
          for (let i = 0; i < type.length; i++) {
            await prisma.artistBandType.create({
              data: {
                artistId: artistData.id,
                style: type[i],
              },
            });
          }
        }

        var token = jwt.sign({ id: decoded.id }, process.env.SECRET, {
          expiresIn: 86400,
        });

        return res.json({ ...artistData, jwt: token });
      } else {
        res.status(401).json({ Code: 401, Message: "Já é um artista" });
      }
    });
  });

  app.post("/user/makeuser", async (req, res) => {
    const {
      document,
      documentType,
      birthDate,
      description,
      openingYear,
      imageIcon,
      gender,
      houseCapacity,
      lat,
      long,
      state,
      city,
      district,
      address,
      number,
      zipcode,
    } = req.body;

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
      const user = await prisma.user.findFirst({
        where: {
          userLoginId: decoded.id,
        },
      });

      if (!user) {
        const userData = await prisma.userData.create({
          data: {
            birthDate,
            description,
            openingYear,
            imageIcon,
            gender,
            houseCapacity: +houseCapacity,
          },
        });

        const addressData = await prisma.address.create({
          data: {
            id: userData.id,
            lat: +lat,
            long: +long,
            state,
            city,
            district,
            address,
            number,
            zipcode,
          },
        });

        const user = await prisma.user.create({
          data: {
            document,
            documentType,
            userLoginId: decoded.id,
            userDataId: userData.id,
          },
          include: {
            UserData: {
              include: {
                Address: true,
              },
            },
            UserLogin: {
              select: {
                email: true,
                id: true,
                roleTypeId: true,
                phone: true,
                name: true,
              },
            },
          },
        });

        var token = jwt.sign({ id: decoded.id }, process.env.SECRET, {
          expiresIn: 86400,
        });

        return res.json({ ...user, jwt: token });
      } else {
        res.status(401).json({ Code: 401, Message: "Já é um usuário" });
      }
    });
  });

  app.get("/user/orders", async (req, res) => {
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

      const userExist = await prisma.userLogin.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (userExist) {
        const user = await prisma.user.findFirst({
          where: {
            userLoginId: userExist.id,
          },
          include: {
            Orders: {
              include: {
                Artist: true,
              },
            },
          },
        });

        if (user) {
          return res.json(user.Orders);
        } else {
          const userArtist = await prisma.artist.findFirst({
            where: {
              userId: userExist.id,
            },
            include: {
              Orders: {
                include: {
                  Artist: true,
                },
              },
            },
          });

          if (userArtist) {
            return res.json(user.Orders);
          } else {
            return res.status(404).send("Usuário não encontrado");
          }
        }
      } else {
        return res.status(404).send("Usuário não encontrado");
      }
    });
  });

  app.get("/user/order/:id", async (req, res) => {
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

      const userOrders = await prisma.orders.findUnique({
        where: {
          id: +id,
        },
      });

      if (userOrders != null) {
        return res.json(userOrders);
      } else {
        return res.send("Nota não encontrada");
      }
    });
  });

  app.get("/user", async (req, res) => {
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
      const userData = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        include: {
          artist: true,
        },
      });
      if (userData) {
        return res.status(200).json({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          roleTypeId: userData.roleTypeId,
          imageIcon: userData.imageIcon,
          artist: userData.artist,
        });
      } else {
        return res
          .status(200)
          .json({ Message: "Usuário não encontrado", Code: "404" });
      }
    });
  });

  app.delete("/user", async (req, res) => {
    const { firstName, lastName } = req.body;
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
      const userData = await prisma.user.update({
        data: {
          situation: 2,
        },
        where: {
          id: decoded.id,
        },
      });
      if (userData) {
        return res.status(200).json("Deletado com Sucesso!");
      } else {
        return res
          .status(200)
          .json({ Message: "Usuário não encontrado", Code: "404" });
      }
    });
  });

  app.post("/favorite", async (req, res) => {
    const { isFavorited, favoriteId, artistId } = req.body;

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

      const userExist = await prisma.userLogin.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (userExist) {
        const favoriteData = await prisma.favorites.upsert({
          where: {
            id: +favoriteId,
          },
          create: {
            artistFavoritedId: artistId,
            userId: decoded.id,
            isFavorited: isFavorited || true,
          },
          update: {
            isFavorited: !!isFavorited,
          },
          include: {
            Artist: true,
          },
        });

        return res.json(favoriteData);
      } else {
        return res.json();
      }
    });
  });
};
