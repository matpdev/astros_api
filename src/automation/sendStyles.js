require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendStyles() {
  const haveItem = await prisma.style.findUnique({
    where: {
      id: 1,
    },
  });
  if (!haveItem) {
    await prisma.style.createMany({
      data: [
        {
          name: "Banda",
        },
        {
          name: "Capela",
        },
        {
          name: "Acustico",
        },
        {
          name: "Coral",
        },
      ],
    });
  }
}

module.exports = { sendStyles };
