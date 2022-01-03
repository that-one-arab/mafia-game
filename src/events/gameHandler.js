const { Game } = require('../models');
const { isEqual, assignPlayers } = require('./gameHelper');
// const { game } = require('./gameConfig');

const game = [
    {
        gameCode: '',
        playersAmount: 0,
        players: [
            {
                socketID: '',
                playerID: '',
                playerName: '',
                isOwner: false,
                playerRole: '',
                playerTeam: '',
                playerAlive: true,
                playerDisconnected: false,
            },
        ],
        gameConfig: {
            isRoomVerified: false,
        },
    },
];

const parseGameRoomPlayers = (players) => {
    return players.map((player) => ({
        ...player,
        playerRole: '',
        playerTeam: '',
        playerAlive: true,
    }));
};

const verifyEmitterToBeOwner = (gameRoom, playerID) => {
    /** Sanity check */
    if (gameRoom && gameRoom.players && gameRoom.players.length) {
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];
            if (player.playerID === playerID) return true;
        }
    }
    throw new Error('Event emitter with ID ', playerID, ' is not the game owner');
};

const indexOfGameRoom = (gameCode) => {
    return game.map((room) => room.gameCode).indexOf(gameCode);
};

const findPlayerIDIndexInRooms = (roomIndex, playerID) => {
    const players = game[roomIndex].players;
    if (players && players.length) {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];

            if (player.playerID === playerID) {
                return {
                    found: true,
                    playerIndex: i,
                };
            }
        }
    }

    return {
        found: false,
    };
};

const findSocketIDIndexInRooms = (socketID) => {
    for (let j = 0; j < game.length; j++) {
        const room = game[j];
        const players = room.players;
        if (players && players.length) {
            for (let i = 0; i < players.length; i++) {
                const player = players[i];

                if (player.socketID === socketID) {
                    return {
                        found: true,
                        playerIndex: i,
                        gameRoomIndex: j,
                    };
                }
            }
        }
    }

    return {
        found: false,
    };
};

const addPlayer = (gameCode, socketID, playerID, playerName) => {
    const roomIndex = game.map((room) => room.gameCode).indexOf(gameCode);

    game[roomIndex].players = [
        ...game[roomIndex].players,
        {
            socketID,
            playerID,
            playerName,
            isOwner: false,
            playerRole: '',
            playerTeam: '',
            playerAlive: true,
            playerDisconnected: false,
        },
    ];
};

const createRoom = (gameCode, socketID, playerID, playerName) => {
    game.push({
        gameCode,
        playersAmount: 0,
        players: [
            {
                socketID,
                playerID,
                playerName,
                isOwner: false,
                playerRole: '',
                playerTeam: '',
                playerAlive: true,
                playerDisconnected: false,
            },
        ],
        gameConfig: {
            isRoomVerified: false,
            hasGameStarted: false,
            areRolesAssigned: false,
        },
        gameProgress: {
            gamePhase: '',
        },
    });
};

const killPlayer = (roomIndex, playerIndex) => {
    game[roomIndex].players[playerIndex].playerAlive = false;
    return game[roomIndex].players[playerIndex];
};

const disconnectPlayer = (roomIndex, playerIndex) => {
    game[roomIndex].players[playerIndex].playerDisconnected = true;
    return game[roomIndex].players[playerIndex];
};

const arePlayersVerified = (dbPlayers, cachePlayers) => {
    const dataBasePlayers = dbPlayers.map((p) => ({ playerID: p.playerID, playerName: p.playerName, isOwner: p.isOwner }));
    const expectedPlayers = cachePlayers.map((p) => ({ playerID: p.playerID, playerName: p.playerName, isOwner: p.isOwner }));
    dataBasePlayers.sort(function (a, b) {
        const idA = a.playerID.toUpperCase();
        const idB = b.playerID.toUpperCase();
        if (idA < idB) {
            return -1;
        }
        if (idA > idB) {
            return 1;
        }

        // names must be equal
        return 0;
    });
    expectedPlayers.sort(function (a, b) {
        const idA = a.playerID.toUpperCase();
        const idB = b.playerID.toUpperCase();
        if (idA < idB) {
            return -1;
        }
        if (idA > idB) {
            return 1;
        }

        // names must be equal
        return 0;
    });
    if (isEqual(dataBasePlayers, expectedPlayers)) return true;
    return false;
};

/**
 * @summary handles reconnecting a possibly disconnected player
 * @param {number} roomIndex the index of the game room
 * @param {number} playerIndex the index of the players array
 * @param {string} playerID
 * @param {string} socketID
 */
function reconnectPlayerHandler(roomIndex, playerIndex, socketID) {
    /** Set disconnected to false */
    game[roomIndex].players[playerIndex].playerDisconnected = false;
    /** Update socket ID */
    game[roomIndex].players[playerIndex].socketID = socketID;
}

/** */
function updateGameRoomOwner(roomIndex, playerID) {
    const { found, playerIndex } = findPlayerIDIndexInRooms(roomIndex, playerID);
    if (found) {
        game[roomIndex].players[playerIndex].isOwner = true;
    }
}

/** */
function assignRolesHandler(io, players) {
    console.log('assignRolesHandler...');
    players.forEach((player) => {
        console.log('emitted to socketID :', player.socketID);
        io.to(player.socketID).emit('assigned-role', player);
    });
}

const safeParsePlayers = (players) => {
    return players.map((player) => ({
        playerID: player.playerID,
        playerName: player.playerName,
        playerAlive: player.playerAlive,
        isOwner: player.isOwner,
    }));
};

module.exports = (gameNps, socket) => {
    console.log('a socket connected');

    socket.on('join-game', (gameCode, playerID, playerName, responseCb) => {
        try {
            console.group('join-game');
            console.log('recieved args :', { gameCode, playerID, playerName });
            if (!gameCode || !playerID || !playerName) throw new Error('Required args cannot be empty');

            // Join players to the same gameCode
            socket.join(gameCode);
            console.log('joined socket ID :', socket.id, ' to room: ', gameCode);

            console.log('checking if room Index already exists...');
            const gameRoomIndex = indexOfGameRoom(gameCode);
            if (gameRoomIndex !== -1) {
                console.log('room Index exists, value :', gameRoomIndex);

                console.log('checking if player already exists in room...');
                const { found: playerExists, playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

                if (!playerExists) {
                    console.log('player does not exists');
                    console.log('proceeding to creating a new player entry to cache with values:', {
                        gameCode,
                        socketID: socket.id,
                        playerID,
                        playerName,
                    });
                    addPlayer(gameCode, socket.id, playerID, playerName);
                } else {
                    console.log('player DOES exist!');
                    const player = game[gameRoomIndex].players[playerIndex];
                    console.log('the player who exists :', player);

                    console.log('checking if they have disconnected...');
                    if (player.playerDisconnected) {
                        console.log('the player has disconnected. Reconnecting...');
                        reconnectPlayerHandler(gameRoomIndex, playerIndex, socket.id);
                    }
                }
            } else {
                console.log('room index does not exist, proceeding to create a new room with values: ', {
                    gameCode: gameCode,
                    socketID: socket.id,
                    playerID,
                    playerName,
                });
                createRoom(gameCode, socket.id, playerID, playerName);
            }

            /** Get index again in case the "gameRoomIndex" var returned null | undefined (happens if game room does not exist) */
            const players = game[indexOfGameRoom(gameCode)].players;
            console.log('current room players :', players);

            if (game[gameRoomIndex].gameConfig.areRolesAssigned) {
                responseCb({
                    status: 200,
                    message: 'Roles are already assigned. Phase is -' + game[gameRoomIndex].gameProgress.gamePhase,
                    players: safeParsePlayers(players),
                });
            }

            gameNps.to(gameCode).emit('game-players', {
                message: 'Player ID' + playerID + ' joined the game',
                players: safeParsePlayers(players),
            });

            console.groupEnd('join-game');
        } catch (error) {
            console.error(error);
            if (error && error.message && error.message.includes('Required args cannot be empty'))
                return responseCb({
                    status: 405,
                    message: error,
                });
            return responseCb({
                status: 500,
                message: 'A server error occurred',
            });
        }
    });

    gameNps.adapter.on('leave-room', (room, id) => {
        try {
            console.group('leave-room');

            const { found, gameRoomIndex, playerIndex } = findSocketIDIndexInRooms(id);

            console.log('found leaving player game room info :', {
                found,
                gameRoomIndex,
                playerIndex,
            });

            if (!found)
                throw new Error(
                    'leave-room listner: could not find socket ID ',
                    id,
                    '. This could mean the socket did not join properly in the first place'
                );

            disconnectPlayer(gameRoomIndex, playerIndex);

            console.log('disconnected the player');

            const players = game[gameRoomIndex].players;
            console.log('new players array :', players);

            const { gameCode } = game[gameRoomIndex];
            const { playerID } = game[gameRoomIndex].players[playerIndex];

            gameNps.to(gameCode).emit('game-players', {
                message: 'Player ID' + playerID + ' has disconnected',
                players: safeParsePlayers(players),
            });

            console.groupEnd('leave-room');
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('verify-room', async (gameCode, playerID) => {
        console.group('verify-room');
        const dbGame = await Game.findOne({ gameCode });
        if (dbGame) {
            let ownerFound = false;
            dbGame.players.forEach((player) => {
                if (player.playerID === playerID) ownerFound = true;
            });

            if (ownerFound) {
                const gameRoomIndex = indexOfGameRoom(gameCode);

                if (gameRoomIndex !== -1 && game[gameRoomIndex].gameConfig.areRolesAssigned === false) {
                    // console.log('setting game owner to true...');
                    updateGameRoomOwner(gameRoomIndex, playerID);

                    const { playersAmount, players: dbPlayers } = dbGame;
                    // console.log('dbGame props:', { playersAmount, dbPlayers });

                    const { players: cachePlayers } = game[gameRoomIndex];
                    // console.log('game cache props:', { cachePlayers });

                    // console.log('verifying players...');
                    if (arePlayersVerified(dbPlayers, cachePlayers)) {
                        // console.log('players verifications passed');
                        const assignedPlayers = assignPlayers(cachePlayers);
                        // console.log('assignedPlayers :', assignedPlayers);

                        console.log('players before assigning roles', game[gameRoomIndex].players);

                        assignRolesHandler(gameNps, assignedPlayers);
                        console.log('assigned roles :', assignedPlayers);

                        console.log('players after assigning roles', game[gameRoomIndex].players);

                        game[gameRoomIndex].gameConfig.areRolesAssigned = true;
                        game[gameRoomIndex].gameProgress.gamePhase = 'day';
                    } else {
                        console.warn('VERIFICATIONS DID NOT PASS!!');
                        /** This code block would run if one or more players who have joined the game
                         * do not exist in the game object fetched from MongoDB. Meaning an unauthorized
                         * player has joined */
                    }
                }
            }
        }

        console.groupEnd('verify-room');
    });
};
