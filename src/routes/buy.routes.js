require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const { calculateDistance, signUserInPagarme } = require("../utils/utils");
const prisma = new PrismaClient(),
  nodemailer = require("nodemailer");

const { default: axios } = require("axios");

const authorization = Buffer.from(
  `${process.env.PAGARME_TEST_TOKEN}:`
).toString("base64");

module.exports = function (app) {
  app.post("/payment/update/", async (req, res) => {
    try {
      const dataId = (
        await prisma.orders.findFirst({
          where: {
            orderPagarmeId: req.body.data.id,
          },
        })
      ).id;

      await prisma.orders.update({
        where: {
          id: dataId,
        },
        data: {
          status: req.body.data.status == "paid" ? "APROVADO" : "PENDENTE",
        },
      });

      return res.json({ message: "Sucess", data: req.body });
    } catch (e) {
      return res.json(e);
    }
  });

  app.post("/payment/checkout", async (req, res) => {
    const {
      dates,
      extras,
      artistId,

      cardName,
      cardExpiration,
      cardCVV,
      cardNumber,
      installments,
      type,
    } = req.body;

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

      const artist = await prisma.artist.findFirst({
        where: {
          id: artistId,
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

      const userData = await prisma.user.findFirst({
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

      let valueExtras = 0,
        shippingVal = 0;

      if (extras) {
        extras.reduce((x, y) => {
          valueExtras +=
            x != undefined
              ? x.value * x.amount + y.value * y.amount
              : y.value * y.amount;
        });
      }

      shippingVal = (
        calculateDistance({
          lat1: userData.UserData.Address[0].lat,
          long1: userData.UserData.Address[0].long,
          lat2: artist.UserData.Address[0].lat,
          long2: artist.UserData.Address[0].long,
        }) * artist.transferFee
      ).toFixed(2);

      let valueTotal =
        Number(valueExtras) + Number(shippingVal) + Number(artist.cacheMax);

      try {
        const data = await axios.post(
          "https://api.pagar.me/core/v5/orders",
          JSON.stringify(
            type == "credit"
              ? {
                  items: [
                    {
                      amount: (valueTotal * 100).toString(),
                      description: artist.UserData.description,
                      quantity: 1,
                      code: artist.id.toString(),
                    },
                  ],
                  payments: [
                    {
                      credit_card: {
                        card: {
                          billing_address: {
                            line_1: `${userData.UserData.Address[0].number} - ${userData.UserData.Address[0].address}`,
                            zip_code: userData.UserData.Address[0].zipcode,
                            state: userData.UserData.Address[0].state,
                            city: userData.UserData.Address[0].city,
                            country: "br",
                          },
                          number: cardNumber,
                          holder_name: cardName,
                          exp_month: cardExpiration.substring(0, 2),
                          exp_year: cardExpiration.substring(2, 4),
                          cvv: cardCVV,
                        },
                        installments: installments,
                        statement_descriptor: "AVENGERS",
                      },
                      payment_method: "credit_card",
                    },
                  ],
                  customer: {
                    name: userData.UserLogin.name,
                    email: userData.UserLogin.email,
                  },
                }
              : {
                  customer: {
                    name: userData.UserLogin.name,
                    email: userData.UserLogin.email,
                    document: userData.document,
                    document_type: userData.documentType,
                    type: "individual",
                    phones: {
                      mobile_phone: {
                        country_code: "55",
                        area_code: "84",
                        number: "994633769",
                      },
                    },
                  },
                  items: [
                    {
                      amount: valueTotal * 10,
                      description: artist.UserData.description,
                      quantity: 1,
                      code: artist.id.toString(),
                    },
                  ],
                  payments: [
                    { Pix: { expires_in: 3600 }, payment_method: "pix" },
                  ],
                }
          ),
          {
            headers: {
              accept: "application/json",
              "content-type": "application/json",
              authorization: "Basic " + authorization,
            },
          }
        );

        if (data.data.status != "failed") {
          await prisma.orders.create({
            data: {
              logGateway: data.data,
              valueTotal,
              dates,
              status: "PENDENTE",
              userId: userData.id,
              artistId: artist.id,
              orderPagarmeId: data.data.id,
              codePagarme: data.data.code,
              transferFee: parseFloat(shippingVal),
              cacheTotal: artist.cacheMin,
            },
          });

          return res.json(
            type == "credit"
              ? { status: "Pendente" }
              : {
                  status: "Pendente",
                  qrCode: data.data.charges[0].last_transaction.qr_code,
                }
          );
        } else {
          return res.status(400).json({
            Code: 400,
            Message: "Ocorreu um erro na criação da Ordem de Pagamento",
          });
        }
      } catch (e) {
        console.log(e);
        return res.status(400).json(e);
      }
    });
  });
};
