const { Game } = require('../models');
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
    throw new Error(
        'Event emitter with ID ',
        playerID,
        ' is not the game owner'
    );
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
            },
        ],
        gameConfig: {
            isRoomVerified: false,
            hasGameStarted: false,
        },
    });
};

const killPlayer = (roomIndex, playerIndex) => {
    game[roomIndex].players[playerIndex].playerAlive = false;
    return game[roomIndex].players[playerIndex];
};

/**
 * EVENTS:
 * join-game
 * game-players
 */

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
            if (!gameCode || !playerID || !playerName)
                throw new Error('Required args cannot be empty');

            // Join players to the same gameCode
            socket.join(gameCode);
            console.log(
                'joined socket ID :',
                socket.id,
                ' to room: ',
                gameCode
            );

            console.log('checking if room Index already exists...');
            const gameRoomIndex = indexOfGameRoom(gameCode);
            if (gameRoomIndex !== -1) {
                console.log('room Index exists, value :', gameRoomIndex);

                console.log('checking if player already exists in room...');
                const { found: playerExists } = findPlayerIDIndexInRooms(
                    gameRoomIndex,
                    playerID
                );

                if (!playerExists) {
                    console.log('player does not exists');
                    console.log(
                        'proceeding to creating a new player entry to cache with values:',
                        {
                            gameCode,
                            socketID: socket.id,
                            playerID,
                            playerName,
                        }
                    );
                    addPlayer(gameCode, socket.id, playerID, playerName);
                }
            } else {
                console.log(
                    'room index does not exist, proceeding to create a new room with values: ',
                    {
                        gameCode: gameCode,
                        socketID: socket.id,
                        playerID,
                        playerName,
                    }
                );
                createRoom(gameCode, socket.id, playerID, playerName);
            }

            /** Get index again in case the "gameRoomIndex" var returned null | undefined (happens if game room does not exist) */
            const players = game[indexOfGameRoom(gameCode)].players;
            console.log('current room players :', players);

            responseCb({
                status: 200,
                message: '',
                players: safeParsePlayers(players),
            });

            gameNps.to(gameCode).emit('game-players', {
                message: 'Player ID' + playerID + ' joined the game',
                players: safeParsePlayers(players),
            });

            console.groupEnd('join-game');
        } catch (error) {
            console.error(error);
            if (
                error &&
                error.message &&
                error.message.includes('Required args cannot be empty')
            )
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

            const { found, gameRoomIndex, playerIndex } =
                findSocketIDIndexInRooms(id);

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

            killPlayer(gameRoomIndex, playerIndex);
            console.log('killed the player');

            const players = game[gameRoomIndex].players;
            console.log('new players array :', players);

            const { gameCode } = game[gameRoomIndex];
            const { playerID } = game[gameRoomIndex].players[playerIndex];

            gameNps.to(gameCode).emit('game-players', {
                message:
                    'Player ID' +
                    playerID +
                    ' has dies because they left the game',
                players: safeParsePlayers(players),
            });

            console.groupEnd('leave-room');
        } catch (error) {
            console.error(error);
        }
    });
};
