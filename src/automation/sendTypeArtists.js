require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendTypeArtists() {
  const haveItem = await prisma.artistType.findUnique({
    where: {
      id: 1,
    },
  });
  if (!haveItem) {
    await prisma.artistType.createMany({
      data: [
        {
          name: "Artista",
        },
        {
          name: "Influenciador",
        },
        {
          name: "Presença Vip",
        },
      ],
    });
  }
}

module.exports = { sendTypeArtists };
