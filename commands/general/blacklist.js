const { MessageEmbed } = require("discord.js");

const axios = require("axios");
const blacklistsModel = require("../../database/blacklists.js");
const lookupName = require("../../utils/lookup-name");

module.exports = {
  name: "blacklist",
  aliases: [],
  category: "general",
  description: "Help",
  run: async (bot, message, args) => {
    if (args[0]) {
      if (args[0] === "show") {
        let blacklists = await blacklistsModel.find({});
        blacklists = blacklists.map((row) => {
          return row.nickname;
        });
        
        const blacklistsJoin = blacklists.join(", ");

        message.channel.send(new MessageEmbed().setTitle(`Blacklisted players:`).setDescription(`${blacklistsJoin}`));
      } else if (args[0] === "add" && args[1]) {
        const ign = args[1];
        const reason = args[2] || "";

        let user;

        try {
          const data = (await lookupName(ign));
          user = data[0];
        } catch (err) {
          return message.channel.send("Error: " + err);
        }
        
        let newPlayer = new blacklistsModel({
          uuid: user.uuid,
          nickname: user.currentName,
          reason
        });

        await newPlayer.save();
        message.channel.send(new MessageEmbed().setDescription(`Added ${user.currentName} to the database!`));

        bot.tracker.reload();
      } else if (args[0] === "remove" && args[1]) {
        const ign = args[1];

        const found = await blacklistsModel.find({ nickname: { $regex: new RegExp(ign), $options: 'i' } });

        if (found) {
          await blacklistsModel.deleteMany({ nickname: { $regex: new RegExp(ign), $options: 'i' } });
          message.channel.send(new MessageEmbed().setDescription(`Removed ${ign} from the database.`));
        } else {
          message.channel.send(new MessageEmbed().setDescription(`${ign} could not be found in the database.`));
        }

        bot.tracker.reload();
      } else if (args[0] === "clear") {
        await blacklistsModel.deleteMany({ });
        message.channel.send(new MessageEmbed().setDescription("Cleared blacklist"));

        this.bot.tracker = new Tracker(this.bot);
        this.bot.tracker.start();
      }
    } else {
      let blacklists = await blacklistsModel.find({});
      blacklists = blacklists.map((row) => {
        return row.nickname;
      });
      
      const blacklistsJoin = blacklists.join(", ");

      message.channel.send(new MessageEmbed().setTitle(`Blacklisted players:`).setDescription(`${blacklistsJoin}`));
    }
  },
};