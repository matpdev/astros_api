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

  app.post("/user/artist", async (req, res) => {
    const {
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
      const user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        include: {
          artist: true,
        },
      });
      if (user.artist == null) {
        const artistData = await prisma.artist.create({
          data: {
            transferFee,
            cacheMin,
            cacheMax,
            icon,
            type,
            style,
            artistTypeId: artistTypeId || 1,
            account,
            agency,
            bank,
            account_type,
          },
        });

        const userData = await prisma.user.update({
          where: {
            id: decoded.id,
          },
          data: {
            artistId: artistData.id,
            fantasyName,
            description,
            lat,
            long,
            instagramLink,
            facebookLink,
            tikTokLink,
            spotifyLink,
            websiteLink,
            youtubeLink,
            roleTypeId: 2,
          },
          include: {
            artist: true,
          },
        });

        return res.json(userData);
      } else {
        res.status(401).json("Já é um artista");
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

  app.get("/user/", async (req, res) => {
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
};
