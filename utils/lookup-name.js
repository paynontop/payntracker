const fetch = require("node-fetch");
const cheerio = require("cheerio");
const lookupUUID = require("./lookup-uuid");

module.exports = name => new Promise(async function(resolve, reject) {
	// Make sure the username is a valid MC username
	if(!name.match(/\w{3,16}/g)) return reject(`"${name}" is not a valid username.`);

	// Begin to scrape content;
	const $ = cheerio.load(await fetch(`https://namemc.com/search?q=${name}`).then(r => r.text()));
	const results = $("body > main > div.row > div.col-lg-7").children(".card.mb-3")

	// Get final listing
	let final = [];

	let usernames = [];

	// Iterate through each result
	results.each(async function() {
		const data = $(this);
		const uuid = data.children(".card-header.py-0").children("a").children(".row").children(".col").children("samp").text();
		usernames.push(uuid);
	});

	// Iterate through each result
	usernames.forEach(async (username, id) => {
		let data = await lookupUUID(username);

		final.push(data);
		usernames[id] = data;

		if(usernames.length === final.length) {
			return resolve(usernames);
		}
	});
})