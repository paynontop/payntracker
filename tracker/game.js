class Game {
  constructor(data) {
    this.map = data.map;
    this.mode = data.mode;
    this.start = data.dateTimestamp;
    this.end = data.endedTimestamp;

    this.ongoing = data.ongoing;

    this.players = [];
  }
}

module.exports = Game;