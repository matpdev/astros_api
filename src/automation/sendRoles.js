require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendRoles() {
  const haveItem = await prisma.roleType.findUnique({
    where: {
      id: 1,
    },
  });
  if (!haveItem) {
    const userData = await prisma.roleType.createMany({
      data: [{ name: "USUARIO" }, { name: "ARTISTA" }, { name: "ADMIN" }],
    });
  }
}

module.exports = { sendRoles };
