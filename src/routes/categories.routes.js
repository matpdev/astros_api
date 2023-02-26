require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const moment = require("moment");
const { calculateDistance } = require("../utils/utils");
const prisma = new PrismaClient();

module.exports = function (app) {
  app.get("/categories", async (req, res) => {
    try {
      const haveItem = await prisma.bandType.findMany({});

      return res.json(haveItem);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  });

  app.post("/categories", async (req, res) => {
    const { name, icon } = req.body;

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
        if (err) {
          return res.status(403).send({
            message: "Sem autorização!",
          });
        }

        const haveItem = await prisma.bandType.create({
          data: {
            name,
            icon,
          },
        });

        if (haveItem) {
          return res.send("Criado com Sucesso!");
        } else {
          return res.status(400).json("Ocorreu um erro na criação");
        }
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  });
};
