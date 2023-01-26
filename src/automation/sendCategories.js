require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendCategories() {
  const haveItem = await prisma.categories.findUnique({
    where: {
      id: 1,
    },
  });
  if (!haveItem) {
    const userData = await prisma.categories.createMany({
      data: [
        {
          name: "Rock",
          icon: "https://pbs.twimg.com/media/FHLbQgnXMAMVbRn.jpg",
        },
        {
          name: "Sertanejo",
          icon: "https://dk2dv4ezy246u.cloudfront.net/widgets/sSEDTwRiphS1_large.jpg",
        },
        {
          name: "Forró",
          icon: "https://pbs.twimg.com/media/FhDY4nKWAAAmoY6.jpg",
        },
        {
          name: "Samba",
          icon: "https://i.pinimg.com/originals/6a/c8/d0/6ac8d0b73727224f00fd288d97a95601.jpg",
        },
      ],
    });
  }
}

module.exports = { sendCategories };
