const { MessageEmbed } = require("discord.js");
const { stripIndents } = require("common-tags");

module.exports = {
  name: "help",
  aliases: ["h", "halp", "commands"],
  category: "general",
  description: "Help",
  run: async (bot, message, args) => {
    if (args[0]) {
      return getCMD(bot, message, args[0]);
    } else {
      return getAll(bot, message);
    }
  },
};

function getAll(bot, message) {
  const embed = new MessageEmbed().setColor("#F58716");

  const commands = (category) => {
    return bot.commands
      .filter((cmd) => cmd.category === category && category != "DOLD")
      .map((cmd) => `- ${cmd.name}`)
      .join("\n");
  };

  const info = bot.categories
    .filter((category) => category != "DOLD")
    .map(
      (cat) =>
        stripIndents`**${cat[0].toUpperCase() + cat.slice(1)}:** \n${commands(
          cat
        )}`
    )
    .reduce((string, category) => string + "\n" + category);

  return message.channel.send(
    embed.setDescription(info).setFooter("Prefix: -")
  );
}

function getCMD(bot, message, input) {
  const embed = new MessageEmbed();

  const cmd =
    bot.commands.get(input.toLowerCase()) ||
    bot.commands.get(bot.aliases.get(input.toLowerCase()));

  let info = `Ingen information om kommandot **${input.toLowerCase()}**`;

  if (!cmd) {
    return message.channel.send(embed.setColor("RED").setDescription(info));
  }

  if (cmd.name) info = `**Namn**: ${cmd.name}`;
  if (cmd.aliases)
    info += `\n**Aliases**: ${cmd.aliases.map((a) => `${a}`).join(", ")}`;
  if (cmd.description) info += `\n**Beskrivning**: ${cmd.description}`;

  return message.channel.send(embed.setColor("GREEN").setDescription(info));
}
