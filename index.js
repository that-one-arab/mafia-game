require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socket = require('socket.io');
const cors = require('cors');
const { uuid } = require('./src/helpers');
const { Room, PlayerAmount } = require('./src/models');

const app = express();

app.use(cors());
app.use(express.json());

const validatePlayersAmount = async (playersAmountInput) => {
    try {
        const playersAmount = await PlayerAmount.find();
        const allowedPlayersAmount = playersAmount[0].amount;
        if (!allowedPlayersAmount.includes(playersAmountInput))
            throw 'NOT_ALLOWED_ERR Players amount not allowed';
    } catch (error) {
        throw new Error(error);
    }
};

app.get('/api/room', async (req, res) => {
    try {
        const { roomCode } = req.query;
        const room = await Room.findOne({ roomCode });
        console.log({ room });
        if (!room) return res.status(400).json('Room was not found');
        return res.json(room);
    } catch (error) {
        console.error(error);
    }
});

app.post('/api/room', async (req, res) => {
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

const connectToDB = async () => {
    const db = await new Promise((resolve, reject) => {
        try {
            mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                // useCreateIndex: true,
                // useFindAndModify: false,
            });

            mongoose.connection.once('open', () => {
                console.log('Database connection has been made');
                resolve(mongoose);
            });
        } catch (error) {
            reject(error);
        }
    });
    return db;
};

const initializeServer = async (port = undefined) => {
    const PORT = process.env.PORT || port;

    const server = await new Promise((resolve, reject) => {
        try {
            const serverr = app.listen(PORT, () =>
                console.log(`Server is listening on port ${PORT}`)
            );
            resolve(serverr);
        } catch (error) {
            reject(error);
        }
    });

    return server;
};

const initializeSocketConn = async (server) => {
    const io = await new Promise((resolve, reject) => {
        try {
            const io = socket(server);

            io.on('connection', function (socket) {
                console.log('Made socket connection');
                socket.on('disconnect', () => {
                    console.log('user disconnected');
                });
            });
            resolve(io);
        } catch (error) {
            reject(error);
        }
    });
    return io;
};

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);
        const io = await initializeSocketConn(server);

        // const kittySchema = new mongoose.Schema({
        //     name: String,
        // });

        // kittySchema.methods.speak = function speak() {
        //     const greeting = this.name
        //         ? 'Meow name is ' + this.name
        //         : "I don't have a name";
        //     console.log(greeting);
        // };

        // const Kitten = mongoose.model('Kitten', kittySchema);

        // const silence = new Kitten({ name: 'Silence' });

        // const fluffy = new Kitten({ name: 'fluffy' });
        // fluffy.speak(); // "Meow name is fluffy"
        // // await fluffy.save();

        // const kittens = await Kitten.find();
        // console.log(kittens);

        // console.log(silence.name); // 'Silence'
    } catch (error) {
        console.error(error);
    }
})();
