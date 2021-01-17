const Hypixel = require("hypixel-api-reborn");

let currentService = 0;

const keys = [
  "",
  "",
  ""
];

let services = [];

keys.forEach((key) => {
  const service = new Hypixel.Client(key);
  services.push(service);
});

const getService = () => {
  currentService += 1;
  if (currentService > keys.length - 1) currentService = 0;

  return services[currentService];
};

module.exports = { getService, keys };