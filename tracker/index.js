const blacklistsModel = require("../database/blacklists.js");
const { asyncForEach } = require("../functions");
const md5 = require("md5");
const moment = require("moment");

const { MessageEmbed } = require("discord.js");

const { keys } = require("./service");

const Player = require("./player"); 
const Game = require("./game"); 

const TIMES = {
  PRINT_STATS: 8000,
  HYPIXEL_API: (60 * 1000) / (90 * keys.length),
  PLAYER_ONLINE: 60000
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Tracker {
  constructor(bot) {
    // Players with UUID as key
    this.players = {};
    
    // Games with hashed as key
    this.games = {};

    this.blacklistedPlayers = [];

    this.parties = [];

    this.callsThisMinute = 0;

    this.bot = bot;
    this.channel = bot.channels.cache.get("795436362370515004");

    // Queues
    this.playerOnlineQueue = [];
    this.latestGamesQueue = [];
  }

  // Fetch blacklisted players from database
  async fetchBlacklistedPlayers() {
    return await blacklistsModel.find({});
  }

  async reload() {
    let newBlacklisted = await this.fetchBlacklistedPlayers();

    newBlacklisted.forEach((player) => {
      if (!this.blacklistedPlayers.includes(player)) {
        this.playerOnlineQueue.push(player.uuid);
      }
    });

    this.blacklistedPlayers = newBlacklisted;
  }

  async start() {
    this.blacklistedPlayers = await this.fetchBlacklistedPlayers();

    // Add blacklisted players to online queue
    this.blacklistedPlayers.forEach(({ uuid }) => {
      this.playerOnlineQueue.push(uuid);
    });

    // Add player online check to queue
    setInterval(() => {
      if (this.playerOnlineQueue.length == 0) {
        this.blacklistedPlayers.forEach(({ uuid }) => {
          this.playerOnlineQueue.push(uuid);
        });
      }
    }, TIMES.PLAYER_ONLINE);

    // Add blacklisted players to latest games queue
    this.blacklistedPlayers.forEach(({ uuid }) => {
      this.latestGamesQueue.push(uuid);
    });

    setInterval(() => {
      this.callsThisMinute = 0;
    }, 60 * 1000)

    // Do first task in queue every 600 ms
    setInterval(async () => {
      if (this.callsThisMinute > 90 * keys.length) return;

      if (this.playerOnlineQueue.length) {
        // Get and remove first player from queue
        const uuid = this.playerOnlineQueue.shift();

        if (uuid in this.players) {
          // Dont update stats
          const { isOnline } = await this.players[uuid].fetchStats();
          this.checkPlayerOnlineStatus(uuid, isOnline);
        } else {
          // Create player and populate stats
          this.players[uuid] = new Player(uuid);
          const { isOnline, stats } = await this.players[uuid].fetchStats();
          this.checkPlayerOnlineStatus(uuid, isOnline);

          this.players[uuid].stats = stats;
        }
        this.callsThisMinute += 1;
      } else if (this.latestGamesQueue.length) {
        // Get and remove first player from queue
        const uuid = this.latestGamesQueue.shift();
        const player = this.players[uuid];

        const latestGames = await player.fetchLatestGames();
        this.callsThisMinute += 1;
        const now = new Date();

        latestGames.forEach(async (gameData) => {
          if (gameData["game"] !== "BEDWARS") return;

          // If game is more than 20 mins old, remove it
          const startTime = new Date(gameData["dateTimestamp"]);
          if (now - startTime > 20 * 60 * 1000) return;
    
          const joinedTitle = gameData["mode"] + gameData["map"] + gameData["dateTimestamp"];
          let hash = md5(joinedTitle);
    
          if (hash in this.games) {
            const oldGame = this.games[hash];
    
            if (oldGame.ongoing && !gameData.ongoing) {
              // Game ended
              await this.gameEnded(hash, gameData);
            }

            if (!oldGame.players.includes(uuid)) {
              this.games[hash].players.push(uuid);
            }
          } else {
            this.games[hash] = new Game(gameData);
            this.games[hash].players.push(uuid);
    
            if (gameData.ongoing) {
              // Game started
              this.gameStarted(hash);
            }
          }
        });
      } else {
        // Push online players to latestGamesQueue
        Object.entries(this.players).forEach(([uuid, player]) => {
          if (player.isOnline) this.latestGamesQueue.push(uuid);
        });
      }
    }, TIMES.HYPIXEL_API);

    // Print stats every 8 seconds
    setInterval(() => {
      const ongoingGames = Object.entries(this.games).filter(([hash, gameData]) => gameData.ongoing);
      this.findParties();

      const playersOnline = Object.entries(this.players).filter(([uuid, player]) => player.isOnline).map(([uuid, player]) => player.nickname);
      console.log("Players online:", playersOnline.join(", "));
    }, TIMES.PRINT_STATS);
  }

  // Finds the party that's related to a player
  findAPlayersParty(uuid) {
    let playersInParty = [uuid];

    this.parties.forEach((party) => {
      if (party.includes(uuid)) {
        playersInParty = party;
      }
    });

    return playersInParty;
  }

  // Announce game started
  gameStarted(hash) {
    const gameData = this.games[hash];
    const playersInParty = this.findAPlayersParty(gameData.players[0]);
    const playersInPartyNicknames = playersInParty.map((uuid) => this.players[uuid].nickname);

    const embed = new MessageEmbed()
      .setTitle(`${playersInPartyNicknames.join(", ")}'s game started`)
      .addField("Mode", gameData.mode, true)
      .addField("Map", gameData.map, true);

    this.channel.send(embed);
  }

  uuidToName(uuid) {
    return this.players[uuid].nickname;
  }

  checkPlayerOnlineStatus(uuid, newOnline) {
    const oldOnline = this.players[uuid].isOnline;

    if (oldOnline != null && oldOnline === false && newOnline) {
      this.channel.send(new MessageEmbed().setTitle(`${playerData.nickname} connected`));
    }

    if (oldOnline && !newOnline) {
      this.channel.send(new MessageEmbed().setTitle(`${playerData.nickname} disconnected`));
    }

    this.players[uuid].isOnline = newOnline;
  }

  // Announce game ended
  async gameEnded(hash, newGameData) {
    this.findParties();
    const oldGameData = this.games[hash];

    const playersInParty = this.findAPlayersParty(oldGameData.players[0]);
    const playersInPartyNicknames = playersInParty.map((uuid) => this.players[uuid].nickname);

    this.games[hash].ongoing = false;
    this.games[hash].end = newGameData.endedTimestamp;

    // PRINT GAME ENEDED, CHECKING STATS
    const messageText = `${playersInPartyNicknames.join(", ")}'s game ended`;

    const startedAt = moment(newGameData.dateTimestamp);
    const endedAt = moment(newGameData.endedTimestamp);

    const gameLength = moment(endedAt - startedAt).format("mm:ss");

    const embed = new MessageEmbed()
      .setTitle(messageText)
      .addField("Mode", newGameData.mode, true)
      .addField("Map", newGameData.map, true)
      .addField("Length", gameLength, true)
      .setDescription("Fetching stats...");

    const message = await this.channel.send(embed);

    await asyncForEach(playersInParty, async (uuid) => {
      sleep(1000);
      const player = this.players[uuid];
      
      const oldStats = player.stats;
      const newPlayer = await player.fetchStats();
      this.callsThisMinute += 1;

      this.checkPlayerOnlineStatus(uuid, newPlayer.isOnline)

      let statsChanged = [];

      await asyncForEach(Object.entries(newPlayer.stats), async ([gameMode, statsCollection]) => {
        await asyncForEach(Object.entries(statsCollection), async ([statType, statValue]) => {
          if (statValue != oldStats[gameMode][statType]) {
            statsChanged.push(`${gameMode} ${statType}: ${oldStats[gameMode][statType]} -> ${statValue}`);
          }
        })
      });

      if (statsChanged.length) {
        embed.addField(player.nickname, statsChanged.join("\n"));
      }

      this.players[uuid].stats = newPlayer.stats;
    });

    embed.setDescription("");
    await message.edit(embed);
  }

  // Detect parties from games array
  findParties() {
    const now = new Date();
    this.parties = [];

    Object.entries(this.games).forEach(([hash, gameData]) => {
      const startTime = new Date(gameData.start);

      // If game is more than 20 mins old, remove it
      if (now - startTime > 20 * 60 * 1000) {
        return delete this.games[hash];
      } else {
        this.parties.push(gameData.players);
      }
    });

    this.parties = Array.from(new Set(this.parties.map(JSON.stringify)), JSON.parse);
  }

  // Filter out parties with size >= 2
  getLegitParties() {
    return this.parties.filter((party) => party.length >= 2);
  }
}

module.exports = Tracker;