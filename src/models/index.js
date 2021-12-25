const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
    playerID: String,
    playerName: String,
    isOwner: Boolean,
});

const roomSchema = new Schema({
    roomCode: String,
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

const Room = model('Room', roomSchema);
const Player = model('Player', playerSchema);
const Game = model('Game', gameSchema);

module.exports = { Room, Player, PlayerAmount, Game };
