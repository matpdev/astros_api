require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const { calculateDistance, signUserInPagarme } = require("../utils/utils");
const prisma = new PrismaClient(),
  nodemailer = require("nodemailer");

const pagarme = require("pagarme");
const { default: axios } = require("axios");

const authorization = Buffer.from(
  `${process.env.PAGARME_TEST_TOKEN}:`
).toString("base64");

module.exports = function (app) {
  app.post("/payment/test/", async (req, res) => {
    try {
      await prisma.orders.update({
        where: {
          codePagarme: req.body.data.id,
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
      lon,
      lat,
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

      const artist = await prisma.user.findUnique({
        where: {
          id: artistId,
        },
        include: {
          artist: true,
        },
      });

      const userData = await prisma.user.findUnique({
        where: {
          id: decoded.id,
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
          lat1: lat,
          long1: lon,
          lat2: artist.lat,
          long2: artist.long,
        }) * artist.artist.transferFee
      ).toFixed(2);

      let valueTotal =
        Number(valueExtras) +
        Number(shippingVal) +
        Number(artist.artist.cacheMax);

      try {
        const data = await axios.post(
          "https://api.pagar.me/core/v5/orders",
          JSON.stringify(
            type == "credit"
              ? {
                  items: [
                    {
                      amount: (valueTotal * 100).toString(),
                      description: artist.description,
                      quantity: 1,
                      code: artist.artist.id.toString(),
                    },
                  ],
                  payments: [
                    {
                      credit_card: {
                        card: {
                          billing_address: {
                            line_1: `${userData.number} - ${userData.address}`,
                            zip_code: userData.zipcode,
                            state: userData.state,
                            city: userData.city,
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
                  customer_id: userData.pagarmeId,
                }
              : {
                  items: [
                    {
                      amount: (valueTotal * 100).toString(),
                      description: artist.description,
                      quantity: 1,
                      code: artist.artist.id.toString(),
                    },
                  ],
                  payments: [
                    { Pix: { expires_in: 2000 }, payment_method: "pix" },
                  ],
                  customer_id: userData.pagarmeId,
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

        await prisma.orders.create({
          data: {
            logGateway: data.data,
            valueTotal,
            dates,
            status: "PENDENTE",
            userId: decoded.id,
            artistId: artist.artist.id,
            orderPagarmeId: data.data.id,
            codePagarme: data.data.code,
          },
        });

        return res.status(200).send("Pedido concluído com Sucesso");
      } catch (e) {
        return res.status(400).json(e.response.data);
      }
    });
  });
};
