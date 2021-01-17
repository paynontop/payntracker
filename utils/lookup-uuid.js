const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = uuid => new Promise(async function(resolve, reject) {
	// If is valid UUID
	if(!uuid.match(/^[0-9a-f]{8}(-)?[0-9a-f]{4}(-)?[0-9a-f]{4}(-)?[0-9a-f]{4}(-)?[0-9a-f]{12}/g)) return reject(`"${uuid}" is not a valid uuid.`);

	// Begin scraping
	const $ = cheerio.load(await fetch(`https://namemc.com/profile/${uuid}`).then(r => r.text()));
	const data = $("body > main > div");

	// Get profile id
	const profileId = data.children("div.col-lg-8.order-lg-2").children(".card.mb-3").children(".card-body.py-1").children(".row").eq(2).children(".col-12").text().split("/")[1]
	if(profileId === undefined) return reject(`"${uuid}" does not map to a valid player.`);

	// Get response
	const response =  {
		profileId,
		currentName: data.children("div.col-lg-8.order-lg-2").children(".card.mb-3").eq(1).children(".card-body.py-1").children(".row").first().children(".col").children("a").text(),
		uuid: data.children("div.col-lg-8.order-lg-2").children(".card.mb-3").children(".card-body.py-1").children(".row").first().children(".col-12").children("samp").text(),
		pastNames:
		  Object.values(data.children("div.col-lg-8.order-lg-2").children(".card.mb-3").eq(1).children(".card-body.py-1").children(".row"))
		  .filter(elem => elem.type === "tag")
		  .map(elem => $(elem))
		  .map(elem => ({
			name: elem.children(".col").children("a").text(),
			changedAt: elem.children(".col-12").children("time").text() ? new Date(elem.children(".col-12").children("time").text()) : null
		}))
	}

	return resolve(response)
});