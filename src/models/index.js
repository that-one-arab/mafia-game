const { Schema, model } = require('mongoose');

const playerSchema = new Schema({
    playerID: String,
    playerName: String,
});

const roomSchema = new Schema({
    roomCode: String,
    playersAmount: Number,
    players: [playerSchema],
    owner: playerSchema,
    creationDate: Date,
});

const playerAmountSchema = new Schema({
    amount: [Number],
});

const PlayerAmount = model('PlayerAmount', playerAmountSchema);

const Room = model('Room', roomSchema);
const Player = model('Player', playerSchema);

module.exports = { Room, Player, PlayerAmount };
