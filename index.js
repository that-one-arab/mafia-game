require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');
const { Room } = require('./src/models');
const { lobbyInterface } = require('./src/state');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

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

const startServer = () => {};

(async () => {
    try {
        await connectToDB();
        const server = await initializeServer(8080);

        const io = socketIO(server);

        const lobbyNps = io.of('/lobby');

        lobbyNps.on('connection', (socket) => {
            console.log('A socket connected to the lobby namespace');

            const lobby = JSON.parse(JSON.stringify(lobbyInterface));

            socket.on(
                'verify-join-room',
                async ({ roomCode, playerName, playerID }, responseCb) => {
                    const room = await Room.findOne({ roomCode });
                    console.log({ room });
                    if (!room)
                        responseCb({
                            status: 400,
                            message: 'room was not found',
                            room: null,
                        });

                    socket.join(room.roomCode);
                    lobby.push({
                        roomCode,
                        players: [
                            {
                                playerName,
                                playerID,
                                isOwner: false,
                            },
                        ],
                    });

                    responseCb({
                        status: 200,
                        message: 'Room was found, joined socket to room',
                        room,
                    });
                }
            );

            lobbyNps.adapter.on('join-room', (room, id) => {
                console.log(
                    `socket ${id} has joined room ${room}. also our lobby arr is: `,
                    lobby
                );
            });

            // io.of('/lobby').adapter.on('join-room', (room, id) => {
            //     console.log(`socket ${id} has joined room ${room}`);
            // });

            // console.log('the rooms :', lobbyNps.adapter.rooms);

            socket.on('disconnect', () => {
                console.log('a socket disconnected from the lobby namespace');
            });
        });

        io.on('connection', function (socket) {
            console.log('Made socket connection');

            socket.on('disconnect', () => {
                console.log('user disconnected');
            });
        });
    } catch (error) {
        console.error(error);
    }
})();
