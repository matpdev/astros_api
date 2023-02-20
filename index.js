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
require("./src/routes/chat.routes")(app);

app.post("/", async (req, res) => {
  res.json("OK");
});

app.get("/sendArtists", async (req, res) => {
  sendArtists();
  res.json("OK");
});

const server = app.listen(3000, () =>
  console.log(`🚀 Server ready at: http://localhost:3000`)
);
