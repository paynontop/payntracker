const { readdirSync } = require("fs");

module.exports = {
  run: (client) => {
    readdirSync("./events/").forEach((file) => {
      let event = require(`../events/${file}`);

      let eventName = file.split(".")[0];
      client.on(eventName, event.bind(null, client));
    });
  },
};
