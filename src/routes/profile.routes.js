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

  app.put("/userdata", async (req, res) => {
    const { name, birthDate, phone, description, facebookLink, instagramLink } =
      req.body;

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

      const userExist = await prisma.user.findFirst({
        where: {
          userLoginId: decoded.id,
        },
        include: {
          UserData: true,
          UserLogin: true,
        },
      });

      if (userExist) {
        const updateUser = await prisma.user.update({
          where: {
            id: userExist.id,
          },
          data: {
            UserData: {
              update: {
                birthDate,
                description,
              },
            },
            UserLogin: {
              update: {
                name,
                phone,
              },
            },
          },
          include: {
            UserData: {
              include: {
                Address: true,
              },
            },
            UserLogin: true,
          },
        });

        var token = jwt.sign({ id: decoded.id }, process.env.SECRET, {
          expiresIn: 86400,
        });

        if (updateUser) {
          return res.json({ ...updateUser, jwt: token });
        } else {
          return res.status(401).json({
            Message: "Erro ao atualizar",
            Code: 401,
          });
        }
      } else {
        const userExist = await prisma.artist.findFirst({
          where: {
            userId: decoded.id,
          },
          include: {
            User: true,
            UserData: {
              include: {
                Address: true,
              },
            },
          },
        });

        if (userExist) {
          const updateUser = await prisma.artist.update({
            where: {
              id: userExist.id,
            },
            data: {
              UserData: {
                update: {
                  birthDate,
                  description,
                },
              },
              User: {
                update: {
                  name,
                  phone,
                },
              },
              facebookLink,
              instagramLink,
            },
            include: {
              User: true,
              UserData: {
                include: {
                  Address: true,
                },
              },
            },
          });

          var token = jwt.sign({ id: decoded.id }, process.env.SECRET, {
            expiresIn: 86400,
          });

          if (updateUser) {
            return res.json({ ...updateUser, jwt: token });
          } else {
            return res.status(401).json({
              Message: "Erro ao atualizar",
              Code: 401,
            });
          }
        } else {
          return res.status(404).json({
            Message: "Usuário não encontrado",
            Code: 404,
          });
        }
      }
    });
  });
};
