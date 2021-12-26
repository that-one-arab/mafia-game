const { uuid } = require('../helpers');
const { Room, Game } = require('../models');
const {
    findSocketIDIndexInLobby,
    findRoomIDIndexInLobby,
    parseLobbyRoomPayload,
    findPlayerIDIndexInLobby,
} = require('./util');

let lobby = [];

lobby = [
    {
        roomCode: '123456',
        playersAmount: 4,
        players: [
            {
                socketID: 'socket-1',
                playerID: 'player-1',
                playerName: 'Jeff',
                isOwner: true,
            },
            {
                socketID: 'socket-2',
                playerID: 'player-2',
                playerName: 'Mike',
                isOwner: false,
            },
            {
                socketID: 'socket-3',
                playerID: 'player-3',
                playerName: 'Luey',
                isOwner: false,
            },
        ],
    },
];

module.exports = (lobbyNps, socket) => {
    const createRoomHandler = async (roomCode, responseCb) => {
        console.log('create-room event fired');

        const room = await Room.findOne({ roomCode });
        if (!room) {
            console.warn('room with roomCode: "', roomCode, '" was not found!');
            responseCb({
                status: 400,
                message: 'room was not found',
                room: null,
            });
        }

        socket.join(room.roomCode);

        lobby.push({
            roomCode,
            playersAmount: room.playersAmount,
            players: [
                {
                    socketID: socket.id,
                    playerID: room.owner.playerID,
                    playerName: room.owner.playerName,
                    isOwner: true,
                },
            ],
        });

        lobbyNps.to(room.roomCode).emit('lobby-players', {
            message: 'Game was created',
            payload: {
                roomCode,
                playersAmount: room.playersAmount,
                players: [
                    {
                        playerID: room.owner.playerID,
                        playerName: room.owner.playerName,
                        isOwner: true,
                    },
                ],
            },
        });
    };

    const joinRoomHandler = async (roomCode, playerName, responseCb) => {
        console.log('join-room event fired');

        const newLobby = JSON.parse(JSON.stringify(lobby));

        const room = await Room.findOne({ roomCode });

        if (!room) {
            console.warn('room with roomCode: "', roomCode, '" was not found!');
            responseCb({
                status: 400,
                message: 'room was not found',
                room: null,
            });
        }
        const lobbyIndex = findRoomIDIndexInLobby(newLobby, roomCode);

        /** If the lobby is already full */
        if (newLobby[lobbyIndex].players.length === room.playersAmount)
            responseCb({
                status: 405,
                message: 'Room is already full',
                room: null,
            });
        else {
            socket.join(room.roomCode);

            const playerID = uuid('PLR-');

            newLobby[lobbyIndex].players = [
                ...lobby[lobbyIndex].players,
                {
                    socketID: socket.id,
                    playerID: playerID,
                    playerName: playerName,
                    isOwner: false,
                },
            ];

            /** If this is the last player that will fill the lobby */
            if (newLobby[lobbyIndex].players.length === room.playersAmount) {
                /** Emit a message to all sockets in the room */
                lobbyNps.to(room.roomCode).emit('lobby-players', {
                    message: 'The game is about to start',
                    payload: parseLobbyRoomPayload(newLobby[lobbyIndex]),
                });
            } /** Else we proceed with joining the player to the lobby */ else {
                /** Emit a message to all sockets in the room */
                lobbyNps.to(room.roomCode).emit('lobby-players', {
                    message: 'A player has joined',
                    payload: parseLobbyRoomPayload(newLobby[lobbyIndex]),
                });
            }

            /** Update lobby cache */
            lobby = newLobby;

            responseCb({
                status: 200,
                message: 'Room was found, joined socket to room',
                room,
                playerID,
            });
        }
    };

    const leaveRoomHandler = async (room, id) => {
        const { found, lobbyIndex, playersIndex } = findSocketIDIndexInLobby(
            lobby,
            id
        );

        const newLobby = JSON.parse(JSON.stringify(lobby));

        if (found) {
            /** If only one player remains in the room, remove the room from lobby */
            if (newLobby[lobbyIndex].players.length === 1) {
                // No need to emit an event because there are no players

                /** Destroy the room */
                await Room.deleteOne({
                    roomCode: newLobby[lobbyIndex].roomCode,
                });
                newLobby.splice(lobbyIndex, 1);
            } /** Else if the player exiting is the owner of the room */ else if (
                newLobby[lobbyIndex].players[playersIndex].isOwner === true
            ) {
                /** Emit a message to all sockets in the room */
                lobbyNps
                    .to(newLobby[lobbyIndex].roomCode)
                    .emit('lobby-players', {
                        message: 'Lobby room owner has exited',
                        payload: null,
                    });

                /** Destroy the room */
                await Room.deleteOne({
                    roomCode: newLobby[lobbyIndex].roomCode,
                });
                newLobby.splice(lobbyIndex, 1);
            } /** Else only remove the player who left */ else {
                newLobby[lobbyIndex].players.splice(playersIndex, 1);

                /** Destroy the game room (if exists) */
                await Game.deleteOne({
                    gameCode: newLobby[lobbyIndex].roomCode,
                });

                /** Emit a message to all sockets in the room */
                lobbyNps
                    .to(newLobby[lobbyIndex].roomCode)
                    .emit('lobby-players', {
                        message: 'A player has left',
                        payload: parseLobbyRoomPayload(newLobby[lobbyIndex]),
                    });
            }

            lobby = newLobby;
        }
    };

    console.log('A socket connected to the lobby namespace');

    socket.on('join-room', joinRoomHandler);

    socket.on('create-room', createRoomHandler);

    lobbyNps.adapter.on('leave-room', leaveRoomHandler);

    socket.on('create-game-room', async (playerID, responseCb) => {
        const { found, lobbyIndex, playersIndex } = findPlayerIDIndexInLobby(
            lobby,
            playerID
        );

        if (!found) {
            responseCb({
                status: 400,
                message: 'Not found',
                room: null,
            });
        } else {
            const { roomCode, playersAmount, players } = lobby[lobbyIndex];

            /** If the selected game players amount does not equal the current players in lobby */
            if (playersAmount !== players.length) {
                responseCb({
                    status: 405,
                    message:
                        'Current players do not satisfy players amount option',
                    room: null,
                });
            } else {
                const game = new Game({
                    gameCode: roomCode,
                    playersAmount,
                    players: players[playersIndex],
                });

                await game.save();
                console.log('game created');

                responseCb({
                    status: 201,
                    message: 'Game created',
                    game,
                });

                lobbyNps.to(roomCode).emit('game-room-created');
            }
        }
    });

    socket.on('join-game-room', async (playerID, responseCb) => {
        console.log('join-game-room :', {
            playerID,
            socketID: socket.id,
        });
        const { found, lobbyIndex, playersIndex } = findPlayerIDIndexInLobby(
            lobby,
            playerID
        );
        if (!found) {
            responseCb({
                status: 400,
                message: 'Lobby room not found',
                room: null,
            });
        } else {
            const { roomCode, players, playersAmount } = lobby[lobbyIndex];

            const game = await Game.findOne({ gameCode: roomCode });

            if (!game)
                responseCb({
                    status: 400,
                    message: 'Game room not found',
                    room: null,
                });
            else {
                game.players = [
                    ...game.players,
                    /** Is an object */
                    players[playersIndex],
                ];

                console.log('updating room :', roomCode, '\nWith values: ', [
                    ...game.players,
                    /** Is an object */
                    players[playersIndex],
                ]);
                await Game.updateOne(
                    { gameCode: roomCode },
                    {
                        players: [
                            ...game.players,
                            /** Is an object */
                            players[playersIndex],
                        ],
                    }
                );
                console.log(
                    'updated game room with values :',
                    players[playersIndex]
                );

                responseCb({
                    status: 200,
                    message: 'Players joined',
                    game,
                });

                if (game.players.length === playersAmount) {
                    console.log('ready to proceed');
                    lobbyNps.to(roomCode).emit('proceed-to-game');
                }
            }
        }
    });

    socket.on('start-game', async (roomCode) => {
        const game = await Game.findOne({ gameCode: roomCode });
        console.log('game :', game);
        console.log('game players :', game.players);

        const roomIDIndex = findRoomIDIndexInLobby(lobby, roomCode);

        console.log({ lobbyRoom: lobby[roomIDIndex] });

        const { playersAmount } = lobby[roomIDIndex];

        if (game && game.players.length === playersAmount) {
            console.log('ready to proceed');
            lobbyNps.to(roomCode).emit('proceed-to-game');
        }
    });

    socket.on('log-server-vals', async () => {
        console.log({ lobby });
    });
};
