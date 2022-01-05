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
                actionOn: '',
                actionLimit: 0,
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
            actionOn: '',
            actionLimit: 0,
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
                actionOn: '',
                actionLimit: 0,
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
            currentActions: [],
            dayCount: 0,
        },
    });
};

const disconnectPlayer = (roomIndex, playerIndex) => {
    game[roomIndex].players[playerIndex].playerDisconnected = true;
    return game[roomIndex].players[playerIndex];
};

const sortPlayers = (players) => {
    return players.sort(function (a, b) {
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
};

const parseMafiaPlayers = (players, playerID) => {
    return players.map((p) => ({
        playerID: p.playerID,
        playerName: p.playerName,
        socketID: p.playerID === playerID ? p.socketID : '',
        isOwner: p.isOwner,
        playerRole: p.playerTeam === 'MAFIA' ? p.playerRole : '',
        playerTeam: p.playerTeam,
        playerAlive: p.playerAlive,
        playerDisconnected: p.playerDisconnected,
        playerIn: p.playerIn,
        actionOn: p.playerTeam === 'MAFIA' ? p.actionOn : '',
    }));
};

const parseTownPlayers = (players, playerID) => {
    return players.map((p) => ({
        playerID: p.playerID,
        playerName: p.playerName,
        socketID: p.playerID === playerID ? p.socketID : '',
        isOwner: p.isOwner,
        playerRole: p.playerID === playerID ? p.playerRole : '',
        playerTeam: p.playerID === playerID ? p.playerTeam : '',
        playerAlive: p.playerAlive,
        playerDisconnected: p.playerDisconnected,
        playerIn: p.playerIn,
        actionOn: p.playerID === playerID ? p.actionOn : '',
    }));
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

/** */
function parsePlayerSelectedActionArr(players, actionGetterID) {
    const safeParsedPlayers = safeParsePlayers(players);
    return safeParsedPlayers.map((player) => ({
        ...player,
        actionSelected: player.playerID === actionGetterID ? true : false,
    }));
}

/** */
function mafiaSafeParsePlayers(players) {
    const parsedPlayers = [];
    players.forEach((player) => {
        if (player.playerTeam === 'MAFIA')
            parsedPlayers.push({
                ...player,
                actionSelected: false,
            });
        else
            parsedPlayers.push({
                playerID: player.playerID,
                playerName: player.playerName,
                playerAlive: player.playerAlive,
                playerTeam: player.playerTeam,
                playerDisconnected: player.playerDisconnected,
                playerIn: player.playerIn,
                actionSelected: false,
            });
    });
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

            let townParsedPlayers = parseTownPlayers(players, playerID);
            let mafiaParsedPlayers = parseMafiaPlayers(players, playerID);
            townParsedPlayers = sortPlayers(townParsedPlayers);
            mafiaParsedPlayers = sortPlayers(mafiaParsedPlayers);

            players.forEach((p) => {
                gameNps.to(p.socketID).emit('game-players', {
                    message: 'Player ID' + playerID + ' joined the game',
                    players: p.playerTeam === 'MAFIA' ? mafiaParsedPlayers : townParsedPlayers,
                });
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

            const { playerID } = game[gameRoomIndex].players[playerIndex];

            let townParsedPlayers = parseTownPlayers(players, playerID);
            let mafiaParsedPlayers = parseMafiaPlayers(players, playerID);

            townParsedPlayers = sortPlayers(townParsedPlayers);
            mafiaParsedPlayers = sortPlayers(mafiaParsedPlayers);

            players.forEach((p) => {
                gameNps.to(p.socketID).emit('game-players', {
                    message: 'Player ID' + playerID + ' has disconnected',
                    players: p.playerTeam === 'MAFIA' ? mafiaParsedPlayers : townParsedPlayers,
                });
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
                        let assignedPlayers = assignPlayers(cachePlayers);
                        assignedPlayers = sortPlayers(assignedPlayers);
                        console.log('assignedPlayers :', assignedPlayers);

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

    socket.on('get-game-props', (gameCode, playerID, responseCb) => {
        console.log('GET_GAME_PROPS: ', gameCode, playerID);
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log({ gameRoomIndex });

        if (gameRoomIndex !== -1) {
            const { players } = game[gameRoomIndex];

            const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

            const player = players[playerIndex];

            let townParsedPlayers = parseTownPlayers(players, playerID);
            let mafiaParsedPlayers = parseMafiaPlayers(players, playerID);

            townParsedPlayers = sortPlayers(townParsedPlayers);
            mafiaParsedPlayers = sortPlayers(mafiaParsedPlayers);

            console.log({ townParsedPlayers });
            console.log({ mafiaParsedPlayers });

            responseCb({
                status: '200',
                props: {
                    gameProgress: game[gameRoomIndex].gameProgress,
                    players: player.playerTeam === 'MAFIA' ? mafiaParsedPlayers : townParsedPlayers,
                },
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

                    const roomFilteredPlayers = players.filter((player) => player.playerIn === room && !player.playerDisconnected);
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
            // const newPlayers = game[gameRoomIndex].players.map((player) => ({
            //     ...player,
            //     playerIn: transitionTo,
            // }));

            // game[gameRoomIndex].players = newPlayers;

            gameNps.to(gameCode).emit('transition-to', transitionTo);
        }
    });

    socket.on('action-on', (gameCode, playerID, actionGetterID) => {
        console.group('action-on');
        console.log({ playerID, actionGetterID });
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log({ gameRoomIndex });

        if (gameRoomIndex !== -1) {
            const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);
            const { players } = game[gameRoomIndex];
            const player = players[playerIndex];
            console.log({ playerIndex, players, player });

            if (player.playerTeam === 'TOWN' && player.playerRole !== 'Townie') {
                /** The action taker double clicked the same action getter, we assume action taker wants to cancel action */
                if (player.actionOn === actionGetterID) {
                    console.log('town, duplicate, initiating remove process...');

                    player.actionOn = '';
                    let parsedPlayers = players.map((p) => ({
                        playerID: p.playerID,
                        playerName: p.playerName,
                        playerTeam: '',
                        playerRole: '',
                        actionOn: '',
                        playerDisconnected: p.playerDisconnected,
                        playerAlive: p.playerAlive,
                    }));
                    parsedPlayers = sortPlayers(parsedPlayers);

                    console.log('returning players:', parsedPlayers);
                    console.log('expecting changes in game room players array :', game[gameRoomIndex].players);

                    gameNps.to(player.socketID).emit('action-confirmed', parsedPlayers);
                } else {
                    console.log('town new, initiating insert process...');
                    player.actionOn = actionGetterID;

                    let parsedPlayers = players.map((p) => ({
                        playerID: p.playerID,
                        playerName: p.playerName,
                        playerTeam: p.playerID === playerID ? p.playerTeam : '',
                        playerRole: p.playerID === playerID ? p.playerRole : '',
                        actionOn: p.playerID === actionGetterID ? actionGetterID : '',
                        playerDisconnected: p.playerDisconnected,
                        playerAlive: p.playerAlive,
                    }));
                    parsedPlayers = sortPlayers(parsedPlayers);

                    console.log('returning players:', parsedPlayers);
                    console.log('expecting changes in game room players array :', game[gameRoomIndex].players);

                    gameNps.to(player.socketID).emit('action-confirmed', parsedPlayers);
                }
            } else if (player.playerTeam === 'MAFIA' && player.playerRole !== 'Goon') {
                if (player.actionOn === actionGetterID) {
                    console.log('mafia, duplicate, initiating remove process...');

                    player.actionOn = '';

                    const mafiaActionOnHelper = (p) => {
                        if (p.playerID === playerID && p.playerTeam === 'MAFIA') return '';
                        else if (p.playerID !== playerID && p.playerTeam === 'MAFIA') return p.actionOn;
                        else return '';
                    };

                    let parsedPlayers = players.map((p) => ({
                        playerID: p.playerID,
                        playerName: p.playerName,
                        playerTeam: p.playerTeam === 'MAFIA' ? p.playerTeam : 'TOWN',
                        playerRole: p.playerTeam === 'MAFIA' ? p.playerRole : '',
                        actionOn: mafiaActionOnHelper(p),
                        playerDisconnected: p.playerDisconnected,
                        playerAlive: p.playerAlive,
                    }));
                    parsedPlayers = sortPlayers(parsedPlayers);

                    console.log('returning players:', parsedPlayers);
                    console.log('expecting changes in game room players array :', game[gameRoomIndex].players);

                    players
                        .filter((p) => p.playerTeam === 'MAFIA')
                        .forEach((p) => gameNps.to(p.socketID).emit('action-confirmed', parsedPlayers));
                } else {
                    console.log('mafia new, initiating insert process...');

                    player.actionOn = actionGetterID;

                    let parsedPlayers = players.map((p) => ({
                        playerID: p.playerID,
                        playerName: p.playerName,
                        playerTeam: p.playerTeam === 'MAFIA' ? p.playerTeam : 'TOWN',
                        playerRole: p.playerTeam === 'MAFIA' ? p.playerRole : '',
                        actionOn: p.playerTeam === 'MAFIA' ? p.actionOn : '',
                        playerDisconnected: p.playerDisconnected,
                        playerAlive: p.playerAlive,
                    }));
                    parsedPlayers = sortPlayers(parsedPlayers);

                    console.log('returning players:', parsedPlayers);
                    console.log('expecting changes in game room players array :', game[gameRoomIndex].players);

                    players
                        .filter((p) => p.playerTeam === 'MAFIA')
                        .forEach((p) => gameNps.to(p.socketID).emit('action-confirmed', parsedPlayers));
                }
            }
        }

        console.groupEnd('action-on');
    });

    socket.on('request-mafia-team', (gameCode, playerID) => {
        console.group('request-mafia-team');
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log({ gameRoomIndex });

        if (gameRoomIndex !== -1) {
            const { players } = game[gameRoomIndex];

            const parsedPlayers = mafiaSafeParsePlayers(players);
            console.log({ parsedPlayers });

            const { socketID: requesterSocketID } = players.find((player) => player.playerID === playerID);
            console.log({ requesterSocketID });

            gameNps.to(requesterSocketID).emit('mafia-team', parsedPlayers);
        }

        console.groupEnd('request-mafia-team');
    });

    socket.on('mafia-action-on', (gameCode, actionTakerID, actionGetterID) => {
        console.log('mafia-action-on, recieved :', gameCode, actionTakerID, actionGetterID);
        const gameRoomIndex = indexOfGameRoom(gameCode);
        console.log('gameRoomIndex :', gameRoomIndex);

        if (gameRoomIndex !== -1) {
            const { playerIndex: actionTakerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, actionTakerID);
            console.log('actionTakerIndex :', actionTakerIndex);
            const actionTaker = game[gameRoomIndex].players[actionTakerIndex];
            console.log('actionTaker :', actionTaker);

            const { playerIndex: actionGetterIndex } = findPlayerIDIndexInRooms(gameRoomIndex, actionGetterID);
            console.log('actionGetterIndex :', actionGetterIndex);
            const actionGetter = game[gameRoomIndex].players[actionGetterIndex];
            console.log('actionGetter :', actionGetter);

            if (actionTaker.role !== 'Goon' && actionTaker.role !== 'Townie') {
                console.log('player does not equal Goon or Townie');
                removePrevAction(gameRoomIndex, actionTakerID);
                console.log('removed prev actions');
                insertAction(gameRoomIndex, actionTakerID, actionGetterID);
                console.log('inserted action');

                console.log('new actions array :', game[gameRoomIndex].gameProgress.currentActions);

                gameNps
                    .to(actionTaker.socketID)
                    .emit('action-confirmed', parsePlayerSelectedActionArr(game[gameRoomIndex].players, actionGetterID));
            }
        }
    });
};
