require('dotenv').config();

const mongoose = require('mongoose');

const { Lobby, Game } = require('./src/models');

/** OPTIONS */
// const lobbyRoom = true;

/** EXECUTION */
const roomCode = '123456';
const playerID = 'player-1';
const playerName = 'Jeff';
const playersAmount = 4;

mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
});

mongoose.connection.once('open', async () => {
    console.log('Database connection has been made');

    await Lobby.deleteMany({});
    await Game.deleteMany({});
    console.log('deleted current rooms');

    const room = new Lobby({
        roomCode,
        playersAmount,
        owner: {
            playerID,
            playerName,
        },
        creationDate: new Date(),
    });

    await room.save();
    console.log('saved lobby room');
    return 0;
});
