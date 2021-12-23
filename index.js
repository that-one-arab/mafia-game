require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const socketIO = require('socket.io');
const cors = require('cors');
const routes = require('./src/routes');
const { Room } = require('./src/models');

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

        let lobby = [];

        lobbyNps.on('connection', (socket) => {
            console.log('A socket connected to the lobby namespace');

            socket.on('create-room', async (roomCode, responseCb) => {
                const lobbyRoomIndex = lobby
                    .map((lobbyRoom) => lobbyRoom.roomCode)
                    .indexOf(roomCode);
                if (
                    lobbyRoomIndex !== -1 &&
                    lobbyRoomIndex[lobbyRoomIndex].roomCode === roomCode
                ) {
                    socket.join(room.roomCode);
                    responseCb({
                        status: 200,
                        message: 'Room already created, joined socket to room',
                        room,
                    });
                }
                console.log('create-room event fired');
                console.log('fetching room with roomCode: "', roomCode, '"...');
                const room = await Room.findOne({ roomCode });
                if (!room) {
                    console.warn(
                        'room with roomCode: "',
                        roomCode,
                        '" was not found!'
                    );
                    responseCb({
                        status: 400,
                        message: 'room was not found',
                        room: null,
                    });
                }
                console.log('room was fetched, room :', room);

                socket.join(room.roomCode);
                console.log('created socket room with code :', room.roomCode);

                lobby.push({
                    roomCode,
                    players: [
                        {
                            socketID: socket.id,
                            playerID: room.owner.playerID,
                            playerName: room.owner.playerName,
                            isOwner: true,
                        },
                    ],
                });
                console.log('created a new lobby entry with values :', {
                    roomCode,
                    players: [
                        {
                            socketID: socket.id,
                            playerID: room.owner.playerID,
                            playerName: room.owner.playerName,
                            isOwner: true,
                        },
                    ],
                });

                responseCb({
                    status: 200,
                    message: 'Room was found, joined socket to room',
                    room,
                });
            });

            socket.on(
                'join-room',
                async (roomCode, playerID, playerName, responseCb) => {
                    console.log('join-room event fired');
                    console.log(
                        'fetching room with roomCode: "',
                        roomCode,
                        '"...'
                    );
                    const room = await Room.findOne({ roomCode });
                    console.log({ room });
                    if (!room) {
                        console.warn(
                            'room with roomCode: "',
                            roomCode,
                            '" was not found!'
                        );
                        responseCb({
                            status: 400,
                            message: 'room was not found',
                            room: null,
                        });
                    }
                    console.log('room was fetched, room :', room);

                    socket.join(room.roomCode);

                    const lobbyRoomIndex = lobby
                        .map((lobbyRoom) => lobbyRoom.roomCode)
                        .indexOf(roomCode);
                    console.log('room index :', lobbyRoomIndex);
                    lobby[lobbyRoomIndex].players = [
                        ...lobby[lobbyRoomIndex].players,
                        {
                            socketID: socket.id,
                            playerID: playerID,
                            playerName: playerName,
                            isOwner: false,
                        },
                    ];

                    console.log('new lobby :', lobby);

                    responseCb({
                        status: 200,
                        message: 'Room was found, joined socket to room',
                        room,
                    });
                }
            );

            socket.on('disconnect', () => {
                console.log('a socket disconnected from the lobby namespace');
            });

            lobbyNps.adapter.on('join-room', (room, id) => {
                console.log(`socket ${id} has joined room ${room}`);
                const lobbyCopy = JSON.parse(JSON.stringify(lobby));

                // const
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
