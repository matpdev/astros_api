require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

module.exports = function (app) {
  app.get("/chat/:room", async (req, res) => {
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
      console.log(userId, artistId);
    });
  });
};
