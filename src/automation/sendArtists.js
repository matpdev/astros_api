require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function sendArtists() {
  const haveItem = await prisma.artist.findUnique({
    where: {
      id: 1,
    },
  });
  if (!haveItem) {
    await prisma.artist.createMany({
      data: [
        {
          name: "Rock Fan Club",
          description: "Só um Rock Fan",
          fantasyName: "Rock Fan",
          transferFee: 200,
          cacheMin: 500,
          cacheMax: 800,
          lat: -5.8688177,
          long: -35.3454139,
          type: [
            {
              name: "Rock",
              id: 1,
            },
          ],
          style: [
            {
              name: "Banda",
              id: 1,
            },
          ],
          icon: "https://e0.pxfuel.com/wallpapers/871/931/desktop-wallpaper-pin-em-anime-icon-aesthetic-sad-anime-girl.jpg",
        },
        {
          name: "Sertanejo Fan Club",
          description: "Só um Sertanejo Fan",
          fantasyName: "Sertanejo Fan",
          transferFee: 300,
          cacheMin: 400,
          cacheMax: 700,
          lat: -5.8688177,
          long: -35.3454139,
          type: [
            {
              name: "Sertanejo",
              id: 2,
            },
          ],
          style: [
            {
              name: "Capela",
              id: 2,
            },
          ],
          icon: "https://i.pinimg.com/originals/fa/c8/b4/fac8b4fd78ae836d0446fe5a53f9bac8.jpg",
        },
        {
          name: "Forró Fan Club",
          description: "Só um Forró Fan",
          fantasyName: "Forró Fan",
          transferFee: 1000,
          cacheMin: 200,
          cacheMax: 1000,
          lat: -5.8688177,
          long: -35.3454139,
          type: [
            {
              name: "Forró",
              id: 3,
            },
          ],
          style: [
            {
              name: "Acustico",
              id: 3,
            },
          ],
          icon: "https://i.pinimg.com/originals/34/7e/7d/347e7df3b728625d8b306d185d1e9175.jpg",
        },
        {
          name: "Samba Fan Club",
          description: "Só um Samba Fan",
          fantasyName: "Samba Fan",
          transferFee: 100,
          cacheMin: 100,
          cacheMax: 200,
          lat: -5.8688177,
          long: -35.3454139,
          type: [
            {
              name: "Samba",
              id: 4,
            },
          ],
          style: [
            {
              name: "Acustico",
              id: 4,
            },
          ],
          icon: "https://i.pinimg.com/564x/65/35/96/6535964c4253bd5026cf8ebd93d09607.jpg",
        },
      ],
    });
  }
}

module.exports = { sendArtists };
