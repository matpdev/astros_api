require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

module.exports = function (app) {
  app.post("/chat/:room", async (req, res) => {
    const { room } = req.params;
    const { userId, artistId } = req.body;

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
    const { userId, artistId, message } = req.body;

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

  app.post("/chat/:room/sendmessage", async (req, res) => {
    const { room } = req.params;
    const { userId, artistId, message } = req.body;

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
