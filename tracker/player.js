const { getService } = require("./service");

class Player {
  constructor(uuid) {
    this.uuid = uuid;
    this.isOnline = null;

    this.fetchStats();
  }

  async fetchStats() {
    try {
      const playerData = await getService().getPlayer(this.uuid);

      this.nickname = playerData.nickname;
      this.isOnline = playerData.isOnline;
  
      const playerStats = playerData["stats"]["bedwars"];
  
      const cleanedStats = {
        overall: {
          winstreak: playerStats["winstreak"],
          fkdr: playerStats["finalKDRatio"],
        },
        fives: {
          winstreak: playerStats["4v4"]["winstreak"],
          fkdr: playerStats["4v4"]["finalKDRatio"],
        }
      };
  
      return {
        isOnline: playerData.isOnline,
        stats: cleanedStats
      };
    } catch (err) {
      console.error("Error fetching stats", err);
    }
  }

  async fetchLatestGames() {
    try {
      return await getService().getRecentGames(this.uuid);
    } catch (err) {
      console.error("Error fetching latest games", err);
    }
  }
}

module.exports = Player;