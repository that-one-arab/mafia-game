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
                playerIn: undefined,
                amountOfVotes: 0,
            },
        ],
        gameConfig: {
            isRoomVerified: false,
        },
        gameProgress: {
            gamePhase: '',
            hasGameStarted: false,
            areRolesAssigned: false,
            currentVotes: [
                {
                    playerID: '',
                    voters: [''],
                },
            ],
            dayCount: 0,
        },
    },
];

const voteResult = (roomIndex, currentVotes) => {
    const alivePlayers = game[roomIndex].players.filter((player) => player.playerAlive);

    for (let i = 0; i < currentVotes.length; i++) {
        const vote = currentVotes[i];
        if (alivePlayers.length / vote.voters.length < 2) {
            return alivePlayers.find((player) => player.playerID === vote.playerID);
        }
    }

    return false;
};

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
            playerIn: undefined,
            amountOfVotes: 0,
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
        },
        gameProgress: {
            gamePhase: '',
            hasGameStarted: false,
            areRolesAssigned: false,
            currentVotes: [],
            dayCount: 0,
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

/** */
function initiateVotes(roomIndex, players) {
    const votesArr = players.map((player) => ({
        playerID: player.playerID,
        voters: [],
    }));

    game[roomIndex].gameProgress.currentVotes = votesArr;
}

/** */
function removePrevVote(roomIndex, voterID) {
    console.group('removePrevVote');
    console.log('values :', { roomIndex, voterID });

    const newVotes = [...game[roomIndex].gameProgress.currentVotes];
    console.log('currentVotes :', newVotes);

    for (let i = 0; i < newVotes.length; i++) {
        console.log('looping index: ', i);
        const vote = newVotes[i];
        console.log('vote obj :', vote);

        if (vote.voters.includes(voterID)) {
            console.log('voter ID included, before splice :', vote);
            vote.voters.splice(vote.voters.indexOf(voterID), 1);
            console.log('after splice :', vote);
        }
    }

    console.log('settign new game room current votes...');
    game[roomIndex].gameProgress.currentVotes = newVotes;
    console.log('new value :', game[roomIndex].gameProgress.currentVotes);

    console.groupEnd('removePrevVote');
}

/** */
function insertVote(roomIndex, voterID, votedID) {
    console.group('insertVote');
    console.log('values :', { roomIndex, voterID, votedID });

    const newVotes = [...game[roomIndex].gameProgress.currentVotes];
    console.log('currentVotes :', newVotes);

    for (let i = 0; i < newVotes.length; i++) {
        const vote = newVotes[i];

        if (vote.playerID === votedID) {
            vote.voters = [...vote.voters, voterID];
        }
    }

    game[roomIndex].gameProgress.currentVotes = newVotes;

    console.log('new value :', game[roomIndex].gameProgress.currentVotes);

    console.groupEnd('insertVote');
}

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

            if (game[gameRoomIndex].gameProgress.areRolesAssigned) {
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
                console.log('owner was found');
                const gameRoomIndex = indexOfGameRoom(gameCode);
                console.log('gameRoomIndex :', gameRoomIndex);

                console.log('areRolesAssigned :', game[gameRoomIndex].gameProgress.areRolesAssigned);
                if (gameRoomIndex !== -1 && game[gameRoomIndex].gameProgress.areRolesAssigned === false) {
                    // console.log('setting game owner to true...');
                    updateGameRoomOwner(gameRoomIndex, playerID);

                    const { players: dbPlayers } = dbGame;
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

                        game[gameRoomIndex].players = assignedPlayers;
                        game[gameRoomIndex].playersAmount = dbGame.playersAmount;
                        game[gameRoomIndex].gameProgress.areRolesAssigned = true;
                        game[gameRoomIndex].gameProgress.hasGameStarted = true;
                        game[gameRoomIndex].gameProgress.gamePhase = 'day';

                        initiateVotes(gameRoomIndex, assignedPlayers);

                        console.log('players after assigning roles', game[gameRoomIndex].players);
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

    socket.on('get-game-props', (gameCode, responseCb) => {
        console.log('get-game-props: ', gameCode);
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            responseCb({
                status: '200',
                props: game[gameRoomIndex].gameProgress,
            });
        }
    });

    socket.on('moved-to', (room, gameCode, playerID) => {
        console.log('moved-to ', gameCode, playerID);
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { found, playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);
            if (found) {
                const { players, playersAmount } = game[gameRoomIndex];

                /** Fire below code only if not all players have already joined the same room component */
                if (players.filter((player) => player.playerIn === room).length !== playersAmount) {
                    game[gameRoomIndex].players[playerIndex].playerIn = room;

                    const roomFilteredPlayers = players.filter((player) => player.playerIn === room);
                    console.log('roomFilteredPlayers :', roomFilteredPlayers);

                    if (playersAmount === roomFilteredPlayers.length) {
                        console.log('emitting all-players-in-room with val: ', room);
                        gameNps.to(gameCode).emit('all-players-in-room', room);

                        if (room === 'day') {
                            console.log('also emitting new day: ', game[gameRoomIndex].gameProgress.dayCount);
                            console.log('before :', game[gameRoomIndex].gameProgress.dayCount);
                            game[gameRoomIndex].gameProgress.dayCount = game[gameRoomIndex].gameProgress.dayCount + 1;
                            console.log('after :', game[gameRoomIndex].gameProgress.dayCount);

                            gameNps.to(gameCode).emit('day-count', game[gameRoomIndex].gameProgress.dayCount);
                        }
                    }
                }
            }
        }
    });

    socket.on('vote-for', (gameCode, voterID, votedID) => {
        console.group('vote-for');
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log('got gameRoomIndex :', gameRoomIndex);

        if (gameRoomIndex !== -1) {
            const { found: voterIndexFound } = findPlayerIDIndexInRooms(gameRoomIndex, voterID);
            const { found: votedIndexFound } = findPlayerIDIndexInRooms(gameRoomIndex, votedID);
            console.log('got found for voter and voted :', voterIndexFound, votedIndexFound);

            if (voterIndexFound && votedIndexFound) {
                removePrevVote(gameRoomIndex, voterID);
                console.log('removed previous vote');

                insertVote(gameRoomIndex, voterID, votedID);
                console.log('inserted new vote');

                gameNps.to(gameCode).emit('votes', game[gameRoomIndex].gameProgress.currentVotes);
                console.log('emitted "votes" to game room: ', gameCode, ' value: ', game[gameRoomIndex].gameProgress.currentVotes);
            }
        }

        console.groupEnd('vote-for');
    });

    socket.on('vote-finished', (gameCode) => {
        console.group('vote-finished');
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log('got gameRoomIndex :', gameRoomIndex);

        if (gameRoomIndex !== -1) {
            const votes = game[gameRoomIndex].gameProgress.currentVotes;

            const voteRes = voteResult(gameRoomIndex, votes);

            if (voteRes) {
                const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, voteRes.playerID);
                game[gameRoomIndex].players[playerIndex].playerAlive = false;

                gameNps.to(gameCode).emit('game-players', {
                    message: 'Player ID' + playerID + ' Has died',
                    players: safeParsePlayers(game[gameRoomIndex].players),
                });

                gameNps.to(gameCode).emit('vote-result', voteRes);
            } else {
                gameNps.to(gameCode).emit('vote-result', 0);
            }
        }

        console.groupEnd('vote-finished');
    });

    socket.on('transition-ready', (gameCode, playerID) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

            const transitionTo = game[gameRoomIndex].players[playerIndex].playerIn === 'day' ? 'night' : 'day';
            const newPlayers = game[gameRoomIndex].players.map((player) => ({
                ...player,
                playerIn: transitionTo,
            }));

            game[gameRoomIndex].players = newPlayers;

            gameNps.to(gameCode).emit('transition-to', transitionTo);
        }
    });
};
