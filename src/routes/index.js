const express = require('express');

const { uuid, validatePlayersAmount } = require('../helpers');
const { Room } = require('../models');

const app = (module.exports = express());

app.get('/room', async (req, res) => {
    try {
        const { roomCode } = req.query;
        const room = await Room.findOne({ roomCode });
        if (!room) return res.status(400).json('Room was not found');
        return res.json('Room found');
    } catch (error) {
        console.error(error);
    }
});

app.post('/room', async (req, res) => {
    console.log({ body: req.body });
    const { playersAmount, playerName } = req.body;
    console.log({ playersAmount, playerName });

    await validatePlayersAmount(playersAmount);

    const playerID = uuid('PLR-');
    const roomCode = uuid('', '', { idFor: 'ROOM_CODE' });
    console.log({ roomCode, playerID });

    const room = new Room({
        roomCode,
        playersAmount,
        owner: {
            playerID,
            playerName,
        },
        creationDate: new Date(),
    });
    console.log({ room });

    await room.save();
    console.log('saved the room');

    return res.status(201).json({ roomCode, playerID });
});
