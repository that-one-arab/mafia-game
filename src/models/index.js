const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
    playerID: String,
    playerName: String,
    isOwner: Boolean,
});

const lobbySchema = new Schema({
    lobbyCode: String,
    playersAmount: Number,
    players: [playerSchema],
    owner: playerSchema,
    creationDate: Date,
});

const gameSchema = new Schema({
    gameCode: String,
    playersAmount: Number,
    players: [playerSchema],
    creationDate: Date,
});

const playerAmountSchema = new Schema({
    amount: [Number],
});

const PlayerAmount = model('PlayerAmount', playerAmountSchema);

const Lobby = model('Lobby', lobbySchema);
const Player = model('Player', playerSchema);
const Game = model('Game', gameSchema);

module.exports = { Lobby, Player, PlayerAmount, Game };
