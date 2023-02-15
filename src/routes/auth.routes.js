require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const { signUserInPagarme } = require("../utils/utils");
const prisma = new PrismaClient();
const moment = require("moment");

const authorization = Buffer.from(
  `${process.env.PAGARME_TEST_TOKEN}:`
).toString("base64");

module.exports = function (app) {
  app.post(`/signup`, async (req, res) => {
    const {
      email,
      password,
      name,
      document,
      birthDate,
      description,
      openingYear,
      phone,
      state,
      city,
      lat,
      long,
      district,
      address,
      number,
      zipcode,
      imageIcon,
      instagramLink,
      facebookLink,
      tikTokLink,
      spotifyLink,
      websiteLink,
      youtubeLink,
      integrationToken,
      plataform,
      houseCapacity,
      isArtist,
      transferFee,
      cacheMin,
      cacheMax,
      rank,
      icon,
      isAccepting,
      createdAt,
      updatedAt,
      fantasyName,
      type,
      style,
      artistTypeId,
      account,
      agency,
      bank,
      account_type,
      gender,
      documentType,
    } = req.body;

    try {
      const userData = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!userData) {
        let artistId = null;

        if (isArtist) {
          artistId = (
            await prisma.artist.create({
              data: {
                transferFee,
                cacheMin,
                cacheMax,
                rank,
                icon,
                isAccepting,
                createdAt,
                updatedAt,
                type,
                style,
                artistTypeId: artistTypeId || 1,
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
                fantasyName,
              },
            })
          ).id;
        }

        const userData = await prisma.user.create({
          data: {
            email,
            password: bcrypt.hashSync(password, 10),
            name,
            document,
            birthDate,
            description,
            openingYear,
            phone,
            state,
            city,
            lat,
            long,
            district,
            address,
            number,
            zipcode,
            imageIcon,
            integrationToken,
            plataform,
            houseCapacity,
            roleTypeId: 1,
            artistId: artistId,
            documentType: documentType,
            gender,
          },
          include: {
            artist: artistId != null ? true : false,
          },
        });

        if (userData) {
          const data = await signUserInPagarme({
            name: userData.name,
            email: userData.email,
            userId: userData.id,
            document: userData.document,
            documenttype: userData.documentType,
            typeUser: isArtist ? "company" : "individual",
            gender: userData.gender,
            country: "BR",
            state: userData.state,
            city: userData.city,
            zipcode: userData.zipcode.replace(/\D/, ""),
            address: userData.address,
            birthdate: moment(new Date(userData.birthDate)).format(
              "MM/DD/YYYY"
            ),
            number: userData.phone.replace(/\D/, "").substring(2),
            areacode: userData.phone.replace(/\D/, "").substring(0, 2),
            countrycode: "55",
            authorization: authorization,
          });

          await prisma.user.update({
            where: {
              id: userData.id,
            },
            data: {
              pagarmeId: data.data.id,
            },
          });

          return res.json({
            email: userData.email,
            name: userData.name,
            document: userData.document,
            fantasyName: userData.fantasyName,
            birthDate: userData.birthDate,
            description: userData.description,
            openingYear: userData.openingYear,
            phone: userData.phone,
            state: userData.state,
            city: userData.city,
            lat: userData.lat,
            long: userData.long,
            district: userData.district,
            address: userData.address,
            number: userData.number,
            zipcode: userData.zipcode,
            imageIcon: userData.imageIcon,
            instagramLink: userData.instagramLink,
            facebookLink: userData.facebookLink,
            tikTokLink: userData.tikTokLink,
            spotifyLink: userData.spotifyLink,
            websiteLink: userData.websiteLink,
            youtubeLink: userData.youtubeLink,
            roleTypeId: userData.roleTypeId,
            houseCapacity: userData.roleTypeId,
            gender: userData.gender,
            notification: true,
            artistId: userData.artistId,
            artist: userData.artistId != null ? userData.artist : null,
          });
        } else {
          return res
            .status(401)
            .json({ Code: 401, Message: "Ocorreu um erro na criação" });
        }
      } else {
        return res
          .status(409)
          .json({ Code: 409, Message: "Usuário Já Existe" });
      }
    } catch (error) {
      console.log(error.response);
      return res.status(400).json("Ocorreu um erro interno");
    }
  });

  app.post(`/signup/plataform`, async (req, res) => {
    const {
      email,
      name,
      document,
      birthDate,
      description,
      openingYear,
      phone,
      state,
      city,
      lat,
      long,
      district,
      address,
      number,
      zipcode,
      imageIcon,
      instagramLink,
      facebookLink,
      tikTokLink,
      spotifyLink,
      websiteLink,
      youtubeLink,
      integrationToken,
      plataform,
      houseCapacity,
      isArtist,
      transferFee,
      cacheMin,
      cacheMax,
      rank,
      icon,
      isAccepting,
      fantasyName,
      type,
      style,
      artistTypeId,
      account,
      agency,
      bank,
      account_type,
    } = req.body;

    try {
      const userData = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!userData) {
        let artistId = null;

        if (isArtist) {
          artistId = (
            await prisma.artist.create({
              data: {
                transferFee,
                cacheMin,
                cacheMax,
                rank,
                icon,
                isAccepting,
                type,
                style,
                artistTypeId: artistTypeId || 1,
                account,
                agency,
                bank,
                account_type,
                fantasyName,
                instagramLink,
                facebookLink,
                tikTokLink,
                spotifyLink,
                websiteLink,
                youtubeLink,
              },
            })
          ).id;
        }

        const userData = await prisma.user.create({
          data: {
            email,
            name,

            document,
            birthDate,
            description,
            openingYear,
            phone,
            state,
            city,
            lat,
            long,
            district,
            address,
            number,
            zipcode,
            imageIcon,

            integrationToken,
            plataform,
            houseCapacity,
            roleTypeId: 1,
            artistId: artistId,
          },
          include: {
            artist: artistId != null ? true : false,
          },
        });

        if (userData) {
          const data = await signUserInPagarme({
            name: userData.name,
            email: userData.email,
            userId: userData.id,
            document: userData.document.replace(/\D/, ""),
            documenttype: userData.documentType,
            typeUser: isArtist ? "company" : "individual",
            gender: userData.gender,
            country: "BR",
            state: userData.state,
            city: userData.city,
            zipcode: userData.zipcode.replace(/\D/, ""),
            address: userData.address,
            birthdate: moment(new Date(userData.birthDate)).format(
              "MM/DD/YYYY"
            ),
            number: userData.phone.replace(/\D/, "").substring(2),
            areacode: userData.phone.replace(/\D/, "").substring(0, 2),
            countrycode: "55",
            authorization: authorization,
          });

          await prisma.user.update({
            where: {
              id: userData.id,
            },
            data: {
              pagarmeId: data.data.id,
            },
          });

          return res.json({
            email: userData.email,
            name: userData.name,
            document: userData.document.replace(/\D/, ""),
            fantasyName: userData.fantasyName,
            birthDate: userData.birthDate,
            description: userData.description,
            openingYear: userData.openingYear,
            phone: userData.phone,
            state: userData.state,
            city: userData.city,
            lat: userData.lat,
            long: userData.long,
            district: userData.district,
            address: userData.address,
            number: userData.number,
            zipcode: userData.zipcode,
            imageIcon: userData.imageIcon,
            instagramLink: userData.instagramLink,
            facebookLink: userData.facebookLink,
            tikTokLink: userData.tikTokLink,
            spotifyLink: userData.spotifyLink,
            websiteLink: userData.websiteLink,
            youtubeLink: userData.youtubeLink,
            roleTypeId: userData.roleTypeId,
            houseCapacity: userData.roleTypeId,
            notification: true,
            artistId: userData.artistId,
            artist: userData.artistId != null ? userData.artist : null,
            integrationToken: userData.integrationToken,
            plataform: userData.plataform,
          });
        } else {
          return res
            .status(400)
            .json({ Code: 400, Message: "Erro ao cadastrar" });
        }
      } else {
        return res
          .status(409)
          .json({ Code: 409, Message: "Usuário Já Existe" });
      }
    } catch (error) {
      console.log();
      return res.json({ Code: 400, Message: error.response.data.errors });
    }
  });

  app.post(`/signin`, async (req, res) => {
    const { email, password, isGFA, integrationToken } = req.body;

    if (!isGFA) {
      let userExist = await prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          artist: true,
        },
      });

      if (userExist) {
        if (userExist.password == null) {
          return res
            .status(404)
            .json({ Code: 404, Message: "Usuário não encontrado" });
        }
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
              name: userExist.name,
              email: userExist.email,
              jwt: token,
              artist: userExist.artist,
              roleTypeId: userExist.roleTypeId,
            });
          }
        } else {
          return res
            .status(404)
            .json({ Message: "Usuário não existe", Code: 404 });
        }
      } else {
        return res
          .status(404)
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
            .status(404)
            .json({ Message: "Usuário não existe", Code: 404 });
        }
      } else {
        return res
          .status(404)
          .json({ Message: "Email incorreto ou não encontrado", Code: 404 });
      }
    }
  });
};
