require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { decode } = require("base64-arraybuffer");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const ExpressFormidable = require("express-formidable");
const { storageClient } = require("../utils/storagefile");
const { b64toBlob } = require("../utils/utils");
const prisma = new PrismaClient();

module.exports = function (app) {
  app.post("/sendphoto", ExpressFormidable(), async (req, res) => {
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
        },
      });
      if (userExist) {
        const fs = require("fs");
        let fileData = fs.readFileSync(req.files.file.path, {
          encoding: "base64",
        });
        const data = await storageClient
          .from("phodios")
          .upload(`${req.fields.path}/${req.fields.name}`, decode(fileData), {
            contentType: req.files.file.type,
          });
        if (data.error) {
          return res.status(400).json({
            Message: "Ocorreu um erro no envio, envie novamente mais tarde",
            Code: 400,
          });
        }
        const userDataUpdate = await prisma.userData.update({
          where: {
            id: userExist.UserData.id,
          },
          data: {
            imageIcon: `https://xgjahiyquzsfpqisbwwm.supabase.co/storage/v1/object/public/phodios/${data.data.path}`,
          },
        });
        if (userDataUpdate) {
          const userUpdated = await prisma.user.findFirst({
            where: {
              userLoginId: decoded.id,
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
          return res.json({ ...userUpdated, jwt: token });
        }
      } else {
        const artistExist = await prisma.artist.findFirst({
          where: {
            userId: decoded.id,
          },
        });
        if (artist) {
          const fs = require("fs");
          let fileData = fs.readFileSync(req.files.file.path, {
            encoding: "base64",
          });
          const data = await storageClient
            .from("phodios")
            .upload(`${req.fields.path}/${req.fields.name}`, decode(fileData), {
              contentType: req.files.file.type,
            });
          const artistDataUpdate = await prisma.artist.update({
            where: {
              id: artistExist.id,
            },
            data: {
              icon: `https://xgjahiyquzsfpqisbwwm.supabase.co/storage/v1/object/public/phodios/${data.data.path}`,
            },
          });
          if (artistDataUpdate) {
            const artistUpdated = await prisma.artist.findFirst({
              where: {
                userId: decoded.id,
              },
              include: {
                UserData: {
                  include: {
                    Address: true,
                  },
                },
                User: true,
              },
            });
            var token = jwt.sign({ id: decoded.id }, process.env.SECRET, {
              expiresIn: 86400,
            });
            return res.json({ ...artistUpdated, jwt: token });
          }
        } else {
          return res.status(404).send({
            message: "Usuário não encontrado",
          });
        }
      }
    });
  });
};
