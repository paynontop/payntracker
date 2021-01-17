module.exports = async (bot, message) => {
  if (message.author.bot) return;

  if (!message.content.toLowerCase().startsWith(bot.prefix)) return;

  const args = message.content.slice(bot.prefix.length).trim().split(/ +/g);
  const cmd = args.shift().toLowerCase();

  if (cmd.length === 0) return;

  let command = bot.commands.get(cmd);
  if (!command) command = bot.commands.get(bot.aliases.get(cmd));
  if (command) command.run(bot, message, args);
};
