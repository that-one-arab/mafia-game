const express = require('express');

const { uuid, validatePlayersAmount } = require('../helpers');
const { Lobby } = require('../models');

const app = (module.exports = express());

app.get('/lobby', async (req, res) => {
    try {
        const { lobbyCode } = req.query;
        const lobby = await Lobby.findOne({ lobbyCode });
        if (!lobby) return res.status(400).json('Lobby was not found');
        return res.json('Lobby found');
    } catch (error) {
        console.error(error);
    }
});

app.post('/lobby', async (req, res) => {
    try {
        // console.log({ body: req.body });
        const { playersAmount, playerName } = req.body;
        // console.log({ playersAmount, playerName });

        await validatePlayersAmount(playersAmount);

        const playerID = uuid('PLR-');
        const lobbyCode = uuid('', '', { idFor: 'ROOM_CODE' });
        // console.log({ lobbyCode, playerID });

        const lobby = new Lobby({
            lobbyCode,
            playersAmount,
            owner: {
                playerID,
                playerName,
            },
            creationDate: new Date(),
        });
        // console.log({ lobby });

        await lobby.save();
        // console.log('saved the lobby');

        return res.status(201).json({ lobbyCode, playerID });
    } catch (error) {
        if (error.message.includes('NOT_ALLOWED_ERR')) return res.status(405).json(error.message);

        return res.status(500).json('Server error');
    }
});
