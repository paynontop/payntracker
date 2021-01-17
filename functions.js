const { MessageEmbed } = require("discord.js");

module.exports = {
  formatDate: (date) => {
    return new Intl.DateTimeFormat("en-US").format(date);
  },

  promptMessage: async (message, author, time, validReactions) => {
    for (const reaction of validReactions) await message.react(reaction);

    const filter = (reaction, user) => {
      if (!user || user.bot) return false;
      return validReactions.includes(reaction.emoji.name);
    };

    return message
      .awaitReactions(filter, { max: 1, time: time * 1000 })
      .then((collected) => collected.first().emoji.name);
  },

  sendMessage: async (message, text, time) => {
    return message.channel.send(text).then((m) => {
      if (time) m.delete(time * 1000);
    });
  },

  generateEmbed: (title, description) => {
    let embed = new MessageEmbed();
    
    if (title != "") embed.setTitle(title);
    if (description != "") embed.setDescription(title);
  },

  getTime: () => {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();

    return [today, dd, mm, yyyy];
  },

  asyncForEach: async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
};
