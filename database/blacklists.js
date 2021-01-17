const mongoose = require("mongoose");

const blacklistsSchema = new mongoose.Schema({
  uuid: {
    type: String
  },

  nickname: {
    type: String
  },

  reason: {
    type: String
  }
});

module.exports = mongoose.model("blacklists", blacklistsSchema);