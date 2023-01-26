require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const prisma = new PrismaClient(),
  nodemailer = require("nodemailer");

module.exports = function (app) {
  app.put("/update/change-password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;

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
        });

        const result = bcrypt.compareSync(oldPassword, userData.password);

        if (result) {
          const userData = await prisma.user.update({
            data: {
              password: bcrypt.hashSync(newPassword, 10),
            },
            where: {
              id: decoded.id,
            },
          });

          return res.status(200).json("Senha Alterada com Sucesso");
        } else {
          return res.status(401).json("A Senha não é igual a antiga");
        }
      });
    } catch (e) {
      return res.json(e);
    }
  });

  app.put("/update/change-password", async (req, res) => {
    const { oldEmail, newEmail } = req.body;

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
        });

        const result = userData.email == oldEmail;

        if (result) {
          const userData = await prisma.user.update({
            data: {
              email: newEmail,
            },
            where: {
              id: decoded.id,
            },
          });

          return res.status(200).json("Email Alterado com Sucesso");
        } else {
          return res.status(401).json("O Email não é igual a antiga");
        }
      });
    } catch (e) {
      return res.json(e);
    }
  });
};
