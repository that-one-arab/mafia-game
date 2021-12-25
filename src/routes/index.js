const express = require('express');

const { uuid, validatePlayersAmount } = require('../helpers');
const { Room } = require('../models');

const app = (module.exports = express());

app.get('/room', async (req, res) => {
    try {
        const { roomCode } = req.query;
        console.log(roomCode);
        const room = await Room.findOne({ roomCode });
        console.log(room);
        if (!room) return res.status(400).json('Room was not found');
        return res.json('Room found');
    } catch (error) {
        console.error(error);
    }
});

app.get('/insert-dummy-room', async () => {
    const roomCode = '123456';
    const playerID = 'player-1';
    const playerName = 'Jeff';
    const playersAmount = 4;

    const room = new Room({
        roomCode,
        playersAmount,
        owner: {
            playerID,
            playerName,
        },
        creationDate: new Date(),
    });

    await room.save();

    return res.status(201).json({ roomCode, playerID });
});

app.post('/room', async (req, res) => {
    // console.log({ body: req.body });
    const { playersAmount, playerName } = req.body;
    // console.log({ playersAmount, playerName });

    await validatePlayersAmount(playersAmount);

    const playerID = uuid('PLR-');
    const roomCode = uuid('', '', { idFor: 'ROOM_CODE' });
    // console.log({ roomCode, playerID });

    const room = new Room({
        roomCode,
        playersAmount,
        owner: {
            playerID,
            playerName,
        },
        creationDate: new Date(),
    });
    // console.log({ room });

    await room.save();
    // console.log('saved the room');

    return res.status(201).json({ roomCode, playerID });
});
