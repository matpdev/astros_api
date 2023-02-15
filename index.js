const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const { sendCategories } = require("./src/automation/sendCategories");
const { sendRoles } = require("./src/automation/sendRoles");
const { sendArtists } = require("./src/automation/sendArtists");
const { sendStyles } = require("./src/automation/sendStyles");
const { sendTypeArtists } = require("./src/automation/sendTypeArtists");

const prisma = new PrismaClient();
const app = express();

var corsOption = {
  origin: "http://localhost:3000",
};

var http = require("http").createServer(app);
var io = require("socket.io")(http);

http.listen(process.env.PORT || 3000, function () {
  var host = http.address().address;
  var port = http.address().port;
  console.log("App listening at http://%s:%s", host, port);
});

app.use(cors(corsOption));
app.use(express.json());

sendRoles();
sendCategories();
sendStyles();
sendTypeArtists();

require("./src/routes/auth.routes")(app);
require("./src/routes/user.routes")(app);
require("./src/routes/profile.routes")(app);
require("./src/routes/artists.routes")(app);
require("./src/routes/buy.routes")(app);

app.get("/", async (req, res) => {
  res.json("OK");
});

app.get("/sendArtists", async (req, res) => {
  sendArtists();
  res.json("OK");
});

io.on("connection", async (socket) => {
  const users = {};

  let userId = socket.request.headers.authorization;
  users[userId] = socket;
  let userData;
  let roomData;

  socket.on("initial", async (message) => {
    let userMessage = JSON.parse(message.replace(/\'/g, '"'));
    const roomExist = await prisma.rooms.findFirst({
      where: {
        userIdClient: Number(userId),
        userIdArtist: Number(userMessage.toId),
      },
    });
    if (!roomExist) {
      roomData = await prisma.rooms.create({
        data: {
          userIdClient: Number(userId),
          userIdArtist: Number(userMessage.toId),
        },
      });
    } else {
      roomData = await prisma.rooms.update({
        where: {
          id: roomExist.id,
        },
        data: {
          isOpen: true,
        },
      });

      console.log(roomData);
    }
  });

  socket.on("disconnect", async (message) => {
    console.log(roomData);
    // await prisma.rooms.update({
    //   where: {
    //     id: roomData.id,
    //   },
    //   data: {
    //     isOpen: false,
    //   },
    // });
  });

  // socket.on("sendTo", (message) => {
  //   let userMessage = JSON.parse(message.replace(/\'/g, '"'));
  //   let user = users[userMessage.toId];
  //   users[userMessage.toId].emit("message", userMessage.msg);
  // });
});
