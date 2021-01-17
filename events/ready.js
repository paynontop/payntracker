const { MessageEmbed } = require("discord.js");
const Tracker = require("../tracker");

module.exports = async (bot) => {
  bot.user.setPresence({ activity: { name: "Hypixel", type: "WATCHING" }, status: "online" });
  console.log(`Hi, ${bot.user.username} is now online!`);

  bot.tracker = new Tracker(bot);
  bot.tracker.start();

  // const embed = new MessageEmbed();

  // embed
  //   .setTitle("Game started")
  //   .addField("Map", "Themap", true)
  //   .addField("Mode", "Themode", true)
  //   .addField("Lenght", "2s", true)
  //   .addField("IIIss", "Value")
  //   .addField("Hello", "Value");

  // bot.channels.cache.get("793190654423466014").send(embed);
};