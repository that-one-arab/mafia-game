const { uuid } = require('../helpers');
const { Lobby, Game } = require('../models');
const {
    findSocketIDIndexInLobby,
    findRoomIDIndexInLobby,
    parseLobbyRoomPayload,
    findPlayerIDIndexInLobby,
} = require('./util');

let lobby = [];

lobby = [
    {
        lobbyCode: '123456',
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
        hasCountdownStarted: false,
    },
];

/**
 * @summary inserts a new lobby room to the lobby cache
 * @param {string} lobbyCode the lobby code
 * @param {number} playersAmount amount of players
 * @param {object[]} players players array
 */
const insertNewLobbyRoom = (lobbyCode, playersAmount, players) => {
    lobby.push({
        lobbyCode,
        playersAmount,
        players,
        hasCountdownStarted: false,
    });
};

/**
 * @summary emits a "lobby-players" event that contains a message and payload object to sockets in a specified room
 * @param {class instance} io the io instance
 * @param {string} lobbyCode the socket room ID
 */
const emitLobbyPlayers = (
    io,
    lobbyCode,
    { playersAmount, players, message }
) => {
    io.to(lobbyCode).emit('lobby-players', {
        message,
        payload: {
            lobbyCode,
            playersAmount,
            players,
        },
    });
};

const joinPlayerToLobbyRoom = (
    roomIndex,
    { socketID, playerID, playerName }
) => {
    lobby[roomIndex].players = [
        ...lobby[roomIndex].players,
        {
            socketID,
            playerID,
            playerName,
            isOwner: false,
        },
    ];
};

const removePlayerFromLobbyRoom = (lobbyRoomIndex, playerIndex) => {
    lobby[lobbyRoomIndex].players.splice(playerIndex, 1);
};

const destroyLobbyRoom = async (lobbyRoomIndex) => {
    /** Destroy the room from DB */
    await Lobby.deleteOne({
        lobbyCode: lobby[lobbyRoomIndex].lobbyCode,
    });
    /** Remove room from cache */
    lobby.splice(lobbyRoomIndex, 1);
};

const isLastPlayer = (roomIndex) => {
    const { players, playersAmount } = lobby[roomIndex];
    if (players.length === playersAmount) return true;
    return false;
};

const emitRoomDestroyed = (io, lobbyCode, { reason }) => {
    io.to(lobbyCode).emit('room-destroyed', {
        reason,
    });
};

const startCountdownHandler = (io, roomIndex, lobbyCode) => {
    lobby[roomIndex].hasCountdownStarted = true;
    io.to(lobbyCode).emit('start-countdown');
};

const stopCountdownHandler = (io, roomIndex, lobbyCode) => {
    lobby[roomIndex].hasCountdownStarted = false;
    io.to(lobbyCode).emit('stop-countdown');
};

const emitStartGame = (io, lobbyCode) => {
    io.to(lobbyCode).emit('start-game');
};

module.exports = (lobbyNps, socket) => {
    const createRoomHandler = async (lobbyCode, responseCb) => {
        const lobbyRoom = await Lobby.findOne({ lobbyCode });

        if (!lobbyRoom) {
            console.warn(
                'room with lobby code: "',
                lobbyCode,
                '" was not found!'
            );
            responseCb({
                status: 400,
                message: 'lobby was not found',
                room: null,
            });
        } else {
            socket.join(lobbyCode);

            responseCb({
                status: 201,
                message: 'Lobby room created',
                room: null,
            });

            const { playersAmount, owner } = lobbyRoom;

            insertNewLobbyRoom(lobbyCode, playersAmount, [
                {
                    socketID: socket.id,
                    playerID: owner.playerID,
                    playerName: owner.playerName,
                    isOwner: true,
                },
            ]);

            emitLobbyPlayers(lobbyNps, lobbyCode, {
                message: 'Game was created',
                playersAmount,
                players: [
                    {
                        playerID: owner.playerID,
                        playerName: owner.playerName,
                    },
                ],
            });
        }
    };

    const joinRoomHandler = async (lobbyCode, playerName, responseCb) => {
        const lobbyRoom = await Lobby.findOne({ lobbyCode });

        if (!lobbyRoom) {
            console.warn(
                'room with lobby code: "',
                lobbyRoom,
                '" was not found!'
            );
            responseCb({
                status: 400,
                message: 'room was not found',
                room: null,
            });
        } else {
            try {
                const lobbyRoomIndex = findRoomIDIndexInLobby(lobby, lobbyCode);

                const { players, playersAmount } = lobby[lobbyRoomIndex];

                /** If the lobby is already full */
                if (players.length === playersAmount)
                    responseCb({
                        status: 405,
                        message: 'Lobby is already full',
                        room: null,
                    });
                else {
                    socket.join(lobbyCode);

                    const playerID = uuid('PLR-');

                    joinPlayerToLobbyRoom(lobbyRoomIndex, {
                        socketID: socket.id,
                        playerID,
                        playerName,
                    });

                    emitLobbyPlayers(lobbyNps, lobbyCode, {
                        playersAmount,
                        players: lobby[lobbyRoomIndex].players,
                        message: 'A player has joined',
                    });

                    responseCb({
                        status: 200,
                        message: 'Lobby was found, joined socket to room',
                        room: lobbyRoom,
                        playerID,
                        playersAmount,
                    });
                    if (isLastPlayer(lobbyRoomIndex)) {
                        emitLobbyPlayers(lobbyNps, lobbyCode, {
                            playersAmount,
                            players,
                            message: 'The game is about to start',
                        });

                        startCountdownHandler(
                            lobbyNps,
                            lobbyRoomIndex,
                            lobbyCode
                        );
                    }
                }
            } catch (error) {
                console.error(error);
                responseCb({
                    status: 500,
                    message: 'Server error occurred',
                    room: null,
                });
            }
        }
    };

    const leaveRoomHandler = async (room, id) => {
        const { found, lobbyRoomIndex, playerIndex } = findSocketIDIndexInLobby(
            lobby,
            id
        );

        if (found) {
            /** if the player exiting is the owner of the room */
            if (lobby[lobbyRoomIndex].players[playerIndex].isOwner) {
                /** Emit a message to all sockets in the room */
                emitRoomDestroyed(lobbyNps, lobby[lobbyRoomIndex].lobbyCode, {
                    reason: 'Lobby room owner has exited',
                });

                await destroyLobbyRoom(lobbyRoomIndex);
            } /** Else only remove the player who left */ else {
                removePlayerFromLobbyRoom(lobbyRoomIndex, playerIndex);

                /** Emit a message to all sockets in the room */
                const {
                    playersAmount,
                    players,
                    lobbyCode,
                    hasCountdownStarted,
                } = lobby[lobbyRoomIndex];

                emitLobbyPlayers(lobbyNps, lobbyCode, {
                    playersAmount,
                    players,
                    message: 'A player has left',
                });

                if (hasCountdownStarted)
                    stopCountdownHandler(lobbyNps, lobbyRoomIndex, lobbyCode);
            }
        }
    };

    console.log('A socket connected to the lobby namespace');

    socket.on('join-room', joinRoomHandler);

    socket.on('create-room', createRoomHandler);

    lobbyNps.adapter.on('leave-room', leaveRoomHandler);

    socket.on('initialize-game', async (lobbyCode) => {
        try {
            /** BLA BLA BLA */

            emitStartGame(lobbyNps, lobbyCode);
        } catch (error) {
            console.error(error);
        }
    });

    // socket.on('create-game-room', async (playerID, responseCb) => {
    //     const { found, lobbyIndex, playersIndex } = findPlayerIDIndexInLobby(
    //         lobby,
    //         playerID
    //     );

    //     if (!found) {
    //         responseCb({
    //             status: 400,
    //             message: 'Not found',
    //             room: null,
    //         });
    //     } else {
    //         const { roomCode, playersAmount, players } = lobby[lobbyIndex];

    //         /** If the selected game players amount does not equal the current players in lobby */
    //         if (playersAmount !== players.length) {
    //             responseCb({
    //                 status: 405,
    //                 message:
    //                     'Current players do not satisfy players amount option',
    //                 room: null,
    //             });
    //         } else {
    //             const game = new Game({
    //                 gameCode: roomCode,
    //                 playersAmount,
    //                 players: players[playersIndex],
    //             });

    //             await game.save();
    //             console.log('game created');

    //             responseCb({
    //                 status: 201,
    //                 message: 'Game created',
    //                 game,
    //             });

    //             lobbyNps.to(roomCode).emit('game-room-created');
    //         }
    //     }
    // });

    // socket.on('join-game-room', async (playerID, responseCb) => {
    //     console.log('join-game-room :', {
    //         playerID,
    //         socketID: socket.id,
    //     });
    //     const { found, lobbyIndex, playersIndex } = findPlayerIDIndexInLobby(
    //         lobby,
    //         playerID
    //     );
    //     if (!found) {
    //         responseCb({
    //             status: 400,
    //             message: 'Lobby room not found',
    //             room: null,
    //         });
    //     } else {
    //         const { roomCode, players, playersAmount } = lobby[lobbyIndex];

    //         const game = await Game.findOne({ gameCode: roomCode });

    //         if (!game)
    //             responseCb({
    //                 status: 400,
    //                 message: 'Game room not found',
    //                 room: null,
    //             });
    //         else {
    //             game.players = [
    //                 ...game.players,
    //                 /** Is an object */
    //                 players[playersIndex],
    //             ];

    //             console.log('updating room :', roomCode, '\nWith values: ', [
    //                 ...game.players,
    //                 /** Is an object */
    //                 players[playersIndex],
    //             ]);
    //             await Game.updateOne(
    //                 { gameCode: roomCode },
    //                 {
    //                     players: [
    //                         ...game.players,
    //                         /** Is an object */
    //                         players[playersIndex],
    //                     ],
    //                 }
    //             );
    //             console.log(
    //                 'updated game room with values :',
    //                 players[playersIndex]
    //             );

    //             responseCb({
    //                 status: 200,
    //                 message: 'Players joined',
    //                 game,
    //             });

    //             if (game.players.length === playersAmount) {
    //                 console.log('ready to proceed');
    //                 lobbyNps.to(roomCode).emit('proceed-to-game');
    //             }
    //         }
    //     }
    // });

    // socket.on('start-game', async (roomCode) => {
    //     const game = await Game.findOne({ gameCode: roomCode });
    //     console.log('game :', game);
    //     console.log('game players :', game.players);

    //     const roomIDIndex = findRoomIDIndexInLobby(lobby, roomCode);

    //     console.log({ lobbyRoom: lobby[roomIDIndex] });

    //     const { playersAmount } = lobby[roomIDIndex];

    //     if (game && game.players.length === playersAmount) {
    //         console.log('ready to proceed');
    //         lobbyNps.to(roomCode).emit('proceed-to-game');
    //     }
    // });

    socket.on('log-server-vals', async () => {
        console.log({ lobby });
    });
};
