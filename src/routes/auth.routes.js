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
    const { email, password, name, phone } = req.body;

    try {
      const userData = await prisma.userLogin.findFirst({
        where: {
          email,
        },
      });

      if (!userData) {
        const userLogin = await prisma.userLogin.create({
          data: {
            name,
            email,
            password: bcrypt.hashSync(password, 10),
            roleTypeId: 1,
            phone: phone.toString().replace(/\D/gi, ""),
          },
        });

        return res.json(userLogin);
      } else {
        return res
          .status(409)
          .json({ Code: 409, Message: "Usuário Já Existe" });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json("Ocorreu um erro interno");
    }
  });

  app.post(`/signup/plataform`, async (req, res) => {
    const { email, name, phone, integrationToken, plataform } = req.body;

    try {
      const user = await prisma.userLogin.findFirst({
        where: {
          OR: [{ integrationToken }, { email, integrationToken }],
        },
      });

      if (!user) {
        const userLogin = await prisma.userLogin.create({
          data: {
            email,
            integrationToken,
            roleTypeId: 1,
            plataform,
            phone: phone.toString().replace(/\D/gi, ""),
            name,
          },
        });

        return res.json(userLogin);
      } else {
        return res
          .status(409)
          .json({ Code: 409, Message: "Usuário Já Existe" });
      }
    } catch (error) {
      console.log(error);
      return res.json({ Code: 400, Message: error });
    }
  });

  app.post(`/signin`, async (req, res) => {
    const { email, password, isGFA, integrationToken } = req.body;

    if (!isGFA) {
      let userExist = await prisma.userLogin.findUnique({
        where: {
          email,
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
            const userData = await prisma.user.findFirst({
              where: {
                userLoginId: userExist.id,
              },
              include: {
                UserData: true,
                UserLogin: {
                  select: {
                    email: true,
                    id: true,
                    roleTypeId: true,
                  },
                },
              },
            });

            if (userData) {
              var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
                expiresIn: 86400,
              });
              return res.status(200).send({
                ...userData,
                jwt: token,
              });
            } else {
              const userData = await prisma.artist.findFirst({
                where: {
                  userId: userExist.id,
                },
                select: {
                  id: true,
                  fantasyName: true,
                  transferFee: true,
                  cacheMin: true,
                  cacheMax: true,
                  rank: true,
                  icon: true,
                  isAccepting: true,
                  account: false,
                  agency: false,
                  bank: false,
                  account_type: false,
                  artistTypeId: true,
                  instagramLink: true,
                  facebookLink: true,
                  tikTokLink: true,
                  spotifyLink: true,
                  websiteLink: true,
                  youtubeLink: true,
                  UserData: true,
                  User: {
                    select: {
                      email: true,
                      id: true,
                      roleTypeId: true,
                    },
                  },
                },
              });

              if (userData) {
                var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
                  expiresIn: 86400,
                });
                return res.status(200).send({
                  ...userData,
                  jwt: token,
                });
              } else {
                var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
                  expiresIn: 86400,
                });
                return res.status(200).send({
                  ...userExist,
                  jwt: token,
                });
              }
            }
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
      let userExist = await prisma.userLogin.findFirst({
        where: {
          integrationToken,
        },
      });

      if (userExist) {
        if (userExist.deletedAt == null) {
          const userData = await prisma.user.findFirst({
            where: {
              userLoginId: userExist.id,
            },
            include: {
              UserData: true,
              UserLogin: {
                select: {
                  email: true,
                  id: true,
                  roleTypeId: true,
                  phone: true,
                  name: true,
                },
              },
            },
          });

          if (userData) {
            var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
              expiresIn: 86400,
            });
            return res.status(200).send({ ...userData, token });
          } else {
            var token = jwt.sign({ id: userExist.id }, process.env.SECRET, {
              expiresIn: 86400,
            });
            const userData = await prisma.artist.findFirst({
              where: {
                userId: userExist.id,
              },
              select: {
                id: true,
                fantasyName: true,
                transferFee: true,
                cacheMin: true,
                cacheMax: true,
                rank: true,
                icon: true,
                isAccepting: true,
                account: false,
                agency: false,
                bank: false,
                account_type: false,
                artistTypeId: true,
                instagramLink: true,
                facebookLink: true,
                tikTokLink: true,
                spotifyLink: true,
                websiteLink: true,
                youtubeLink: true,
                UserData: true,
                User: {
                  select: {
                    email: true,
                    id: true,
                    roleTypeId: true,
                    phone: true,
                    name: true,
                  },
                },
              },
            });

            if (userData) {
              return res.status(200).send({ ...userData, token });
            } else {
              return res.status(200).send({
                ...userExist,
                jwt: token,
              });
            }
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
    }
  });
};

/* 
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
      const userData = await prisma.userLogin.findFirst({
        where: {
          email,
        },
      });

      if (!userData) {
        const userLogin = await prisma.userLogin.create({
          data: {
            email,
            password: bcrypt.hashSync(password, 10),
            roleTypeId: 1,
          },
        });

        const userData = await prisma.userData.create({
          data: {
            birthDate,
            description,
            openingYear,
            imageIcon,
            gender,
            houseCapacity,
          },
        });

        await prisma.address.create({
          data: {
            id: userData.id,
            lat,
            long,
            state,
            city,
            district,
            address,
            number,
            zipcode,
          },
        });

        if (!isArtist) {
          const user = await prisma.user.create({
            data: {
              name,
              document,
              documentType,
              phone,
              userDataId: userData.id,
              userLoginId: userLogin.id,
            },
            include: {
              UserData: true,
              UserLogin: true,
            },
          });

          return res.json(user);
        } else {
          const user = await prisma.artist.create({
            data: {
              fantasyName,
              transferFee,
              cacheMin,
              cacheMax,
              rank,
              icon,
              isAccepting,
              createdAt,
              updatedAt,
              instagramLink,
              facebookLink,
              tikTokLink,
              spotifyLink,
              websiteLink,
              youtubeLink,
              account,
              agency,
              bank,
              account_type,
              userId: userLogin.id,
              userDataId: userData.id,
              artistTypeId: 1,
            },
          });

          if (style) {
            for (let i = 0; i < style.length; i++) {
              await prisma.artistStyle.create({
                data: {
                  artistId: user.id,
                  style: style[i],
                },
              });
            }
          }

          if (type) {
            for (let i = 0; i < style.length; i++) {
              await prisma.artistBandType.create({
                data: {
                  artistId: user.id,
                  style: style[i],
                },
              });
            }
          }

          return res.json(user);
        }
      } else {
        return res
          .status(409)
          .json({ Code: 409, Message: "Usuário Já Existe" });
      }
    } catch (error) {
      console.log(error);
      return res.status(400).json("Ocorreu um erro interno");
    }
  });
*/
