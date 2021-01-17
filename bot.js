const { Client, Collection } = require("discord.js");
const { config } = require("dotenv");
const fs = require("fs");
const mongoose = require("mongoose");

const bot = new Client();

bot.commands = new Collection();
bot.aliases = new Collection();

bot.categories = fs.readdirSync("./commands/");
bot.prefix = "-";

config({
  path: __dirname + "/.env",
});

["command", "event"].forEach((handler) => {
  bot[handler] = require(`./handler/${handler}`);
  bot[handler].run(bot);
});

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to database");
}).catch((err) => {
  console.log("Unable to connect to database ", err);
});

bot.login(process.env.TOKEN);

bot.on("disconnect", () => console.log("Disconnecting"));
bot.on("reconnecting", () => console.log("Reconnecting"));
bot.on("error", (e) => console.log(e));
bot.on("warn", (info) => console.log(info));

process.on("unhandledRejection", (err) => {
  console.error(err);
});