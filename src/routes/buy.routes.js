require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
let bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const { calculateDistance } = require("../utils/utils");
const prisma = new PrismaClient(),
  nodemailer = require("nodemailer");

const pagarme = require("pagarme");

module.exports = function (app) {
  app.post("/payment/test", async (req, res) => {
    const client = await pagarme.client.connect({
      api_key: process.env.PAGARME_TOKEN,
    });

    const transaction = await client.transactions
      .create(req.body)
      .catch((e) => {
        console.log(e);
      });

    return res.json({ message: "Sucess", data: transaction });
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

      const artist = await prisma.artist.findUnique({
        where: {
          id: artistId,
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
        }) * artist.transferFee
      ).toFixed(2);

      let valueTotal =
        Number(valueExtras) + Number(shippingVal) + Number(artist.cacheMax);

      let sendDataTransaction = {
        amount: (valueTotal * 100).toString(),
        card_holder_name: cardName,
        card_expiration_date: cardExpiration,
        card_cvv: cardCVV,
        card_number: cardNumber,
        customer: {
          name: `${userData.firstName} ${userData.lastName}`,
          external_id: "#3311",
          email: userData.email,
          type: "individual",
          country: "br",
          phone_numbers: [`+55${userData.phone}`],
          documents: [{ type: "cpf", number: userData.document }],
        },
        billing: {
          name: `${userData.firstName} ${userData.lastName}`,
          address: {
            country: "br",
            state: userData.state,
            city: userData.city,
            neighborhood: userData.district,
            street: userData.address,
            street_number: userData.number,
            zipcode: userData.zipcode,
          },
        },
        items: [
          {
            id: artist.id.toString(),
            title: artist.fantasyName,
            date: "2023-01-01",
            unit_price: (valueTotal * 100).toString(),
            quantity: 1,
            tangible: false,
          },
        ],
      };

      const client = await pagarme.client.connect({
        api_key: process.env.PAGARME_TOKEN,
      });

      const transaction = await client.transactions.create(sendDataTransaction);

      if (shippingVal && valueExtras) {
        await prisma.orders.create({
          data: {
            logGateway: transaction,
            valueTotal,
            dates,
            status: "PENDENTE",
            userId: decoded.id,
            artistId: artist.id,
          },
        });
        return res.status(200).send(shippingVal.toString());
      }
    });
  });
};
