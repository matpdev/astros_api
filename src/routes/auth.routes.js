require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

module.exports = function (app) {
  app.post(`/signup`, async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      password,
      imageIcon,
      roleTypeId,
      isGFA,
      document,
      phone,
      integrationToken,
      plataform,
      cityUser,
      ufUser,
      districtUser,
      addressUser,
      numberUser,

      isArtist,
      name,
      description,
      fantasyName,
      transferFee,
      cacheMin,
      cacheMax,
      lat,
      long,
      city,
      uf,
      district,
      address,
      number,
      icon,
      isAccepting,
      type,
      style,
      zipcode,
      zipcodeUser,
    } = req.body;

    if (!isGFA) {
      if (isArtist) {
        if (!firstName && !lastName) {
          return res.status(403).json("Necessário ter um nome!");
        }

        let userExist = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!userExist) {
          const artistData = await prisma.artist.create({
            data: {
              name,
              description,
              fantasyName,
              transferFee,
              cacheMin,
              cacheMax,
              lat,
              long,
              city,
              uf,
              district,
              address,
              number,
              icon,
              isAccepting,
              type,
              style,
            },
          });
          const result = await prisma.user.create({
            data: {
              firstName,
              lastName,
              email,
              password: bcrypt.hashSync(password, 10),
              roleTypeId: +roleTypeId || 1,
              imageIcon,
              artistId: artistData.id,
              district: districtUser,
              address: addressUser,
              number: numberUser,
              zipcode: zipcodeUser,
              state: ufUser,
              city: cityUser,
              phone,
              document,
            },
            include: {
              artist: true,
            },
          });
          return res.json({
            id: result.id,
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
            roleTypeId: result.roleTypeId,
            imageIcon: result.imageIcon,
            district: result.district,
            address: result.address,
            number: result.number,
            zipcode: result.zipcode,
            state: result.state,
            city: result.city,
            artist: result.artist,
            jwt: jwt.sign({ id: result.id }, process.env.SECRET, {
              expiresIn: 86400,
            }),
          });
        } else {
          return res.status(409).json("Usuário Já Existe com este Email");
        }
      } else {
        if (!firstName && !lastName) {
          return res.status(403).json("Necessário ter um nome!");
        }

        let userExist = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!userExist) {
          const result = await prisma.user.create({
            data: {
              firstName,
              lastName,
              email,
              password: bcrypt.hashSync(password, 10),
              roleTypeId: +roleTypeId || 1,
              imageIcon,
              district: districtUser,
              address: addressUser,
              number: numberUser,
              zipcode: zipcodeUser,
              state: ufUser,
              city: cityUser,
            },
          });
          return res.json({
            id: result.id,
            firstName: result.firstName,
            lastName: result.lastName,
            email: result.email,
            district: result.district,
            address: result.address,
            number: result.number,
            zipcode: result.zipcode,
            state: result.state,
            city: result.city,
            roleTypeId: result.roleTypeId,
            imageIcon: result.imageIcon,
            jwt: jwt.sign({ id: result.id }, process.env.SECRET, {
              expiresIn: 86400,
            }),
          });
        } else {
          return res.status(409).json("Usuário Já Existe com este Email");
        }
      }
    } else {
      let userExist = await prisma.user.findFirst({
        where: {
          OR: [
            {
              email,
              integrationToken,
            },
            {
              integrationToken,
            },
          ],
        },
      });

      if (!userExist) {
        const result = await prisma.user.create({
          data: {
            firstName,
            lastName,
            email,
            imageIcon,
            roleTypeId: +roleTypeId || 1,
            plataform,
            integrationToken,
          },
        });
        return res.json({
          id: result.id,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          integrationToken: integrationToken,
          roleTypeId: result.roleTypeId,
          imageIcon: result.imageIcon,
          jwt: jwt.sign({ id: result.id }, process.env.SECRET, {
            expiresIn: 86400,
          }),
        });
      } else {
        return res.json({
          id: userExist.id,
          firstName: userExist.firstName,
          lastName: userExist.lastName,
          email: userExist.email,
          district: result.district,
          address: result.address,
          number: result.number,
          zipcode: result.zipcode,
          state: result.state,
          city: result.city,
          integrationToken: integrationToken,
          roleTypeId: userExist.roleTypeId,
          imageIcon: userExist.imageIcon,
          jwt: jwt.sign({ id: userExist.id }, process.env.SECRET, {
            expiresIn: 86400,
          }),
        });
      }
    }
  });

  app.post(`/signin`, async (req, res) => {
    const { email, password, isGFA, integrationToken } = req.body;

    if (!isGFA) {
      let userExist = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (userExist) {
        if (userExist.deletedAt == null) {
          const result = bcrypt.compareSync(password, userExist.password);
          if (!result) {
            return res
              .status(403)
              .json({ Message: "Senha incorreta", Code: 403 });
          }
          if (result) {
            var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
              expiresIn: 86400,
            });
            return res.status(200).send({
              id: userExist.id,
              firstName: userExist.firstName,
              lastName: userExist.lastName,
              email: userExist.email,
              jwt: token,
              roleTypeId: userExist.roleTypeId,
            });
          }
        } else {
          return res
            .status(409)
            .json({ Message: "Usuário não existe", Code: 404 });
        }
      } else {
        return res
          .status(409)
          .json({ Message: "Email incorreto ou não encontrado", Code: 404 });
      }
    } else {
      let userExist = await prisma.user.findFirst({
        where: {
          integrationToken,
        },
        include: {
          artist: true,
        },
      });

      if (userExist) {
        if (userExist.deletedAt == null) {
          var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
            expiresIn: 86400,
          });
          return res.status(200).send({
            id: userExist.id,
            firstName: userExist.firstName,
            lastName: userExist.lastName,
            email: userExist.email,
            jwt: token,
            roleTypeId: userExist.roleTypeId,
            integrationToken,
            imageIcon: userExist.imageIcon,
            artist: userExist.artist,
          });
        } else {
          return res
            .status(409)
            .json({ Message: "Usuário não existe", Code: 404 });
        }
      } else {
        return res
          .status(409)
          .json({ Message: "Email incorreto ou não encontrado", Code: 404 });
      }
    }
  });
};
