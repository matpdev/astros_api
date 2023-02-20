require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

module.exports = function (app) {
  app.post("/chat/messages", async (req, res) => {
    const { userId, artistId, room } = req.body;

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
      const roomExist = await prisma.rooms.findFirst({
        where: {
          id: room,
        },
        include: {
          messages: true,
        },
      });

      if (roomExist) {
        const messages = roomExist.messages;
        console.log(messages);
      }
    });
  });

  app.post("/chat/createroom", async (req, res) => {
    const { artistId } = req.body;

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
      try {
        const createRoom = await prisma.rooms.create({
          data: {
            userIdClient: decoded.id,
            userIdArtist: artistId,
          },
        });

        return res.json(createRoom);
      } catch (error) {
        return res.json(error);
      }
    });
  });

  app.post("/chat/sendmessage", async (req, res) => {
    const { userId, artistId, message, room } = req.body;

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
      console.log(userId, artistId);
    });
  });
};
