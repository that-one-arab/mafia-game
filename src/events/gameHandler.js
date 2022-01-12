const { Game } = require('../models');
const { isEqual, assignPlayers, shuffle } = require('./gameHelper');
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
                actionCount: 0,
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
            dayResult: [],
            timers: [
                {
                    playerID: '',
                    playerTimer: 0,
                },
            ],
            gamePaused: false,
            currentTimer: 0,
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
            actionCount: 0,
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
                actionCount: 0,
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
            dayResult: [],
            timers: [],
            gamePaused: false,
            currentTimer: 0,
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
        actionCount: p.playerID === playerID ? p.actionCount : '',
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
    players.forEach((player) => {
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
    const newVotes = [...game[roomIndex].gameProgress.currentVotes];

    for (let i = 0; i < newVotes.length; i++) {
        const vote = newVotes[i];

        if (vote.voters.includes(voterID)) {
            vote.voters.splice(vote.voters.indexOf(voterID), 1);
        }
    }

    game[roomIndex].gameProgress.currentVotes = newVotes;
}

/** */
function insertVote(roomIndex, voterID, votedID) {
    const newVotes = [...game[roomIndex].gameProgress.currentVotes];

    for (let i = 0; i < newVotes.length; i++) {
        const vote = newVotes[i];

        if (vote.playerID === votedID) {
            vote.voters = [...vote.voters, voterID];
        }
    }

    game[roomIndex].gameProgress.currentVotes = newVotes;
}

/** */
function verifyWinningCondition(players) {
    const mafPlayers = players.filter((p) => p.playerTeam === 'MAFIA');
    const townPlayers = players.filter((p) => p.playerTeam === 'TOWN');

    if (mafPlayers.every((p) => p.playerAlive === false)) {
        return 'TOWN';
    } else if (townPlayers.every((p) => p.playerAlive === false)) {
        return 'MAFIA';
    }

    return null;
}

module.exports = (gameNps, socket) => {
    socket.on('join-game', (gameCode, playerID, playerName, responseCb) => {
        try {
            if (!gameCode || !playerID || !playerName) throw new Error('Required args cannot be empty');

            // Join players to the same gameCode
            socket.join(gameCode);

            const gameRoomIndex = indexOfGameRoom(gameCode);
            if (gameRoomIndex !== -1) {
                const { found: playerExists, playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

                if (!playerExists) {
                    addPlayer(gameCode, socket.id, playerID, playerName);
                } else {
                    const player = game[gameRoomIndex].players[playerIndex];

                    if (player.playerDisconnected) {
                        reconnectPlayerHandler(gameRoomIndex, playerIndex, socket.id);

                        /** If all the players are in the room, and there is no players who are disconnected and alive */
                        if (
                            game[gameRoomIndex].players.length === game[gameRoomIndex].playersAmount &&
                            game[gameRoomIndex].players.filter((player) => player.playerDisconnected && player.playerAlive).length === 0
                        ) {
                            game[gameRoomIndex].gameProgress.gamePaused = false;
                            gameNps.to(gameCode).emit('unpause-game');
                        }
                    }
                }
            } else {
                createRoom(gameCode, socket.id, playerID, playerName);
            }

            /** Get index again in case the "gameRoomIndex" var returned null | undefined (happens if game room does not exist) */
            const players = game[indexOfGameRoom(gameCode)].players;

            if (game[gameRoomIndex].gameProgress && game[gameRoomIndex].gameProgress.areRolesAssigned) {
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
            const { found, gameRoomIndex, playerIndex } = findSocketIDIndexInRooms(id);

            if (!found)
                console.error(
                    'leave-room listner: could not find socket ID ',
                    id,
                    '. This could mean the socket did not join properly in the first place'
                );
            else {
                disconnectPlayer(gameRoomIndex, playerIndex);

                /** Switch ownership of room */
                if (game[gameRoomIndex].players[playerIndex].isOwner) {
                    game[gameRoomIndex].players[playerIndex].isOwner = false;

                    const newOwner = game[gameRoomIndex].players.filter(
                        (player) => player.isOwner === false && player.playerDisconnected === false
                    )[0];

                    const newOwnerIndex = game[gameRoomIndex].players.findIndex((player) => player.playerID === newOwner.playerID);

                    game[gameRoomIndex].players[newOwnerIndex].isOwner = true;
                }

                const players = game[gameRoomIndex].players;

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

                if (game[gameRoomIndex].players.filter((player) => player.playerDisconnected && player.playerAlive).length) {
                    game[gameRoomIndex].gameProgress.gamePaused = true;
                    gameNps.to(game[gameRoomIndex].gameCode).emit('pause-game');
                }
            }
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('verify-room', async (gameCode, playerID) => {
        const dbGame = await Game.findOne({ gameCode });
        if (dbGame) {
            let ownerFound = false;
            dbGame.players.forEach((player) => {
                if (player.playerID === playerID) ownerFound = true;
            });

            if (ownerFound) {
                const gameRoomIndex = indexOfGameRoom(gameCode);

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

                        assignRolesHandler(gameNps, assignedPlayers);

                        game[gameRoomIndex].players = assignedPlayers;
                        game[gameRoomIndex].playersAmount = dbGame.playersAmount;
                        game[gameRoomIndex].gameProgress.areRolesAssigned = true;
                        game[gameRoomIndex].gameProgress.hasGameStarted = true;
                        game[gameRoomIndex].gameProgress.gamePhase = 'day';

                        initiateVotes(gameRoomIndex, assignedPlayers);
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
        try {
            const gameRoomIndex = indexOfGameRoom(gameCode);

            if (gameRoomIndex !== -1) {
                const { players } = game[gameRoomIndex];

                const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

                const player = players[playerIndex];

                let townParsedPlayers = parseTownPlayers(players, playerID);
                let mafiaParsedPlayers = parseMafiaPlayers(players, playerID);

                townParsedPlayers = sortPlayers(townParsedPlayers);
                mafiaParsedPlayers = sortPlayers(mafiaParsedPlayers);

                responseCb({
                    status: '200',
                    props: {
                        gameProgress: game[gameRoomIndex].gameProgress,
                        players: player.playerTeam === 'MAFIA' ? mafiaParsedPlayers : townParsedPlayers,
                    },
                });

                const winner = verifyWinningCondition(players);
                console.log('winner2 :', winner);
                if (winner) {
                    gameNps.to(gameCode).emit('game-ended', winner, players);
                    game.splice(gameRoomIndex, 1);
                }
            }
        } catch (error) {
            console.error(error);
        }
    });

    socket.on('moved-to', (room, gameCode, playerID) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { found, playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);
            if (found) {
                const { players, playersAmount } = game[gameRoomIndex];

                /** Fire below code only if not all players have already joined the same room component */
                if (players.filter((player) => player.playerIn === room).length !== playersAmount) {
                    game[gameRoomIndex].players[playerIndex].playerIn = room;

                    /** Emit all-players-in-room event only if the players have
                     * 1- Joined the same exact room
                     * 2- Disconnected players are only dead players
                     */

                    if (
                        players.filter((player) => player.playerDisconnected && player.playerAlive).length === 0 &&
                        players.every((player) => player.playerIn === room)
                    ) {
                        game[gameRoomIndex].gameProgress.gamePhase = room;
                        gameNps.to(gameCode).emit('all-players-in-room', room);

                        if (room === 'day') {
                            game[gameRoomIndex].gameProgress.dayCount = game[gameRoomIndex].gameProgress.dayCount + 1;

                            gameNps.to(gameCode).emit('day-count', game[gameRoomIndex].gameProgress.dayCount);
                        }
                    }
                }
            }
        }
    });

    socket.on('vote-for', (gameCode, voterID, votedID) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { found: voterIndexFound } = findPlayerIDIndexInRooms(gameRoomIndex, voterID);
            const { found: votedIndexFound } = findPlayerIDIndexInRooms(gameRoomIndex, votedID);

            if (voterIndexFound && votedIndexFound) {
                removePrevVote(gameRoomIndex, voterID);

                insertVote(gameRoomIndex, voterID, votedID);

                gameNps.to(gameCode).emit('votes', game[gameRoomIndex].gameProgress.currentVotes);
            }
        }
    });

    socket.on('vote-finished', (gameCode) => {
        /** After votes are finished, call initializeVotes() function to clear all votes */
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const votes = game[gameRoomIndex].gameProgress.currentVotes;

            const voteRes = voteResult(gameRoomIndex, votes);

            if (voteRes) {
                const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, voteRes.playerID);
                game[gameRoomIndex].players[playerIndex].playerAlive = false;

                gameNps.to(gameCode).emit('vote-result', voteRes);
            } else {
                gameNps.to(gameCode).emit('vote-result', 0);
            }

            initiateVotes(gameRoomIndex, game[gameRoomIndex].players);

            const winner = verifyWinningCondition(game[gameRoomIndex].players);
            console.log('winner1 :', winner);
            if (winner) {
                gameNps.to(gameCode).emit('game-ended', winner, game[gameRoomIndex].players);
                game.splice(gameRoomIndex, 1);
            }
        }
    });

    socket.on('transition-ready', (gameCode, playerID) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);

            const transitionTo = game[gameRoomIndex].players[playerIndex].playerIn === 'day' ? 'night' : 'day';

            gameNps.to(gameCode).emit('transition-to', transitionTo);
        }
    });

    socket.on('action-on', (gameCode, playerID, actionGetterID) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);

        if (gameRoomIndex !== -1) {
            const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, playerID);
            const { players } = game[gameRoomIndex];
            const player = players[playerIndex];

            if (player.playerTeam === 'TOWN' && player.playerRole !== 'Townie') {
                /** The action taker double clicked the same action getter, we assume action taker wants to cancel action */
                if (player.actionOn === actionGetterID) {
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

                    gameNps.to(player.socketID).emit('action-confirmed', parsedPlayers);
                } else {
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

                    gameNps.to(player.socketID).emit('action-confirmed', parsedPlayers);
                }
            } else if (player.playerTeam === 'MAFIA' && player.playerRole !== 'Goon') {
                if (player.actionOn === actionGetterID) {
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

                    players
                        .filter((p) => p.playerTeam === 'MAFIA')
                        .forEach((p) => gameNps.to(p.socketID).emit('action-confirmed', parsedPlayers));
                } else {
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

                    players
                        .filter((p) => p.playerTeam === 'MAFIA')
                        .forEach((p) => gameNps.to(p.socketID).emit('action-confirmed', parsedPlayers));
                }
            }
        }
    });

    /** */
    function isTargetProtected(players, targetID) {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.playerRole === 'Doctor' && player.actionOn === targetID) return true;
        }

        return false;
    }

    /** */
    function findGodfather(players) {
        return players.find((p) => p.playerRole === 'Godfather' && p.playerAlive);
    }

    /** */
    function didVigTarget(players, targetID) {
        let isVigRoleblocked = false;
        let hasVigTargeted = false;

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.playerRole === 'Vigilante' && player.actionOn === targetID) {
                hasVigTargeted = true;
                for (let j = 0; j < players.length; j++) {
                    const p = players[j];
                    if (p.playerRole === 'Mermaid' || p.playerRole === 'Escort') {
                        if (p.actionOn === player.playerID) {
                            isVigRoleblocked = true;
                        }
                    }
                }
            }
        }

        if (hasVigTargeted && !isVigRoleblocked) return true;
        return false;
    }

    /**
     * OBJECTIVE: Find if player has been targeted by any entity
     * If player has been targeted, find if the targeter has been role blocked
     * If targeted and targeter is not role blocked, return true
     */
    function isPlayerTargeted(players, playerID, mafGunner) {
        let isMafGunnerRoleblocked = false;

        const godfather = findGodfather(players);
        if (godfather && godfather.actionOn === playerID) {
            for (let i = 0; i < players.length; i++) {
                const player = players[i];

                if (player.playerRole === 'Mermaid' || player.playerRole === 'Escort') {
                    if (player.actionOn === mafGunner.playerID) isMafGunnerRoleblocked = true;
                }
            }

            if (!isMafGunnerRoleblocked) return true;
        }

        if (didVigTarget(players, playerID)) return true;

        const mafiaVotes = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.playerRole === 'Mafia' && player.actionOn) {
                if (mafiaVotes.map((p) => p.playerID).includes(player.actionOn)) {
                    const index = mafiaVotes.findIndex((p) => p.playerID === player.actionOn);
                    mafiaVotes[index].votes = mafiaVotes[index].votes + 1;
                } else {
                    mafiaVotes.push({ votes: 1, player: player.actionOn });
                }
            }
        }

        if (mafiaVotes.length) {
            const highestVotes = mafiaVotes.sort((a, b) => b.votes - a.votes)[0];

            if (highestVotes.player === playerID) {
                for (let i = 0; i < players.length; i++) {
                    const player = players[i];

                    if (player.playerRole === 'Mermaid' || player.playerRole === 'Escort') {
                        if (player.actionOn === mafGunner.playerID) isMafGunnerRoleblocked = true;
                    }
                }

                if (!isMafGunnerRoleblocked) return true;
            }
        }

        return false;
    }

    /** */
    function parseMafiaTarget(players) {
        const godfather = findGodfather(players);
        if (godfather && godfather.actionOn) return players.find((player) => player.playerID === godfather.actionOn);

        const mafiaVotes = [];

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.playerRole === 'Mafia' && player.actionOn) {
                if (mafiaVotes.map((p) => p.playerID).includes(player.actionOn)) {
                    const index = mafiaVotes.findIndex((p) => p.playerID === player.actionOn);
                    mafiaVotes[index].votes = mafiaVotes[index].votes + 1;
                } else {
                    mafiaVotes.push({ votes: 1, player: player.actionOn });
                }
            }
        }

        if (mafiaVotes.length) {
            const highestVotes = mafiaVotes.sort((a, b) => b.votes - a.votes)[0];
            return players.find((player) => player.playerID === highestVotes.player);
        }
    }

    /** */
    function isPlayerBlocked(players, playerID) {
        for (let i = 0; i < players.length; i++) {
            const player = players[i];

            if (player.playerRole === 'Escort' || player.playerRole === 'Mermaid') {
                if (player.actionOn === playerID) return true;
            }
        }

        return false;
    }

    /** */
    function findMafGunner(players) {
        let mafPlayers = players.filter((p) => p.playerTeam === 'MAFIA');
        // .sort((playerA, playerB) => playerA.playerName - playerB.playerName);

        mafPlayers = shuffle(mafPlayers);

        for (let i = 0; i < mafPlayers.length; i++) {
            const mafPlayer = mafPlayers[i];

            if (mafPlayer.playerAlive) return mafPlayer;
        }

        return mafPlayers.find((player) => player.playerRole === 'Godfather' && player.playerAlive);
    }

    socket.on('action-finished', (gameCode) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);
        if (gameRoomIndex !== -1) {
            game[gameRoomIndex].gameProgress.dayResult = [];

            gameNps.to(gameCode).emit('action-stop');

            const { players } = game[gameRoomIndex];

            const actionResults = players.map((player) => ({
                socketID: player.socketID,
                playerID: player.playerID,
                results: [],
            }));

            const modifyActionResult = (playerID, result) => {
                const index = actionResults.findIndex((p) => p.playerID === playerID);

                actionResults[index] = {
                    ...actionResults[index],
                    results: [...actionResults[index].results, result],
                };
            };

            /** I have saved a player */
            const MY_DOCTOR_PROTECTED = 'MY_DOCTOR_PROTECTED';
            const SHERRIF_RESULT = 'SHERRIF_RESULT';
            const DETECTIVE_RESULT = 'DETECTIVE_RESULT';

            /** I have guarded myself and killed my intruder */
            const BRAWLER_GUARDED = 'BRAWLER_GUARDED';

            /** I was saved by a doctor */
            const DOCTOR_PROTECTED_ME = 'DOCTOR_PROTECTED_ME';
            /** This target is protected */
            const TARGET_PROTECTED = 'TARGET_PROTECTED';
            const KILLED = 'KILLED';
            const VIG_KILLED = 'VIG_KILLED';
            const BLOCKED = 'BLOCKED';
            const MAF_GUNNER_BLOCKED = 'MAF_GUNNER_BLOCKED';
            const I_BLOCKED = 'I_BLOCKED';
            const DEATH = 'DEATH';
            const ACTION_USED = 'ACTION_USED';

            const mafiaGunner = findMafGunner(players);
            const target = parseMafiaTarget(players);

            players.forEach((player) => {
                switch (player.playerRole) {
                    case 'Doctor':
                        /** If doctor is blocked from protecting */
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        } else {
                            /** If doctor protection target is targeted by mafia */
                            if (player.actionOn && isPlayerTargeted(players, player.actionOn, mafiaGunner)) {
                                modifyActionResult(player.playerID, {
                                    code: MY_DOCTOR_PROTECTED,
                                    payload: '',
                                });
                            }
                        }

                        /** If doctor is targeted */
                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Vigilante':
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        }

                        if (isPlayerTargeted(players, player.playerID)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        if (player.actionOn) {
                            if (isTargetProtected(players, player.actionOn)) {
                                modifyActionResult(player.playerID, {
                                    code: TARGET_PROTECTED,
                                    payload: player.actionCount - 1,
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: VIG_KILLED,
                                    payload: player.actionCount - 1,
                                });
                            }
                        }

                        break;

                    case 'Brawler':
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });

                            if (isPlayerTargeted(players, player.playerID)) {
                                if (isTargetProtected(players, player.playerID)) {
                                    modifyActionResult(player.playerID, {
                                        code: DOCTOR_PROTECTED_ME,
                                        payload: '',
                                    });
                                } else {
                                    modifyActionResult(player.playerID, {
                                        code: DEATH,
                                        payload: '',
                                    });
                                }
                            }
                        } else if (isPlayerTargeted(players, player.playerID)) {
                            if (player.actionOn) {
                                modifyActionResult(player.playerID, {
                                    code: BRAWLER_GUARDED,
                                    payload: player.actionCount - 1,
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        } else {
                            if (player.actionOn) {
                                modifyActionResult(player.playerID, {
                                    code: ACTION_USED,
                                    payload: player.actionCount - 1,
                                });
                            }
                        }

                        break;

                    case 'Detective':
                        /** Is player blocked */
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        } else {
                            if (player.actionOn) {
                                const detectiveRoleRes = players.find((p) => p.playerID === player.actionOn).playerRole;

                                modifyActionResult(player.playerID, {
                                    code: DETECTIVE_RESULT,
                                    payload: detectiveRoleRes,
                                });
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Sherrif':
                        /** Is player blocked */
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        } else {
                            if (player.actionOn) {
                                const sherrifTeamRes = players.find((p) => p.playerID === player.actionOn).playerTeam;

                                modifyActionResult(player.playerID, {
                                    code: SHERRIF_RESULT,
                                    payload: sherrifTeamRes,
                                });
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Mermaid':
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        } else {
                            if (player.actionOn) {
                                modifyActionResult(player.playerID, {
                                    code: I_BLOCKED,
                                    payload: '',
                                });
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Mafia':
                        if (target) {
                            if (isPlayerBlocked(players, mafiaGunner.playerID)) {
                                if (mafiaGunner.playerID === player.playerID) {
                                    modifyActionResult(player.playerID, {
                                        code: BLOCKED,
                                        payload: '',
                                    });
                                } else {
                                    modifyActionResult(player.playerID, {
                                        code: MAF_GUNNER_BLOCKED,
                                        payload: '',
                                    });
                                }
                            } else {
                                if (target.playerRole === 'Brawler' && target.actionOn) {
                                    if (mafiaGunner.playerID === player.playerID) {
                                        modifyActionResult(player.playerID, {
                                            code: DEATH,
                                            payload: '',
                                        });
                                    } else {
                                        modifyActionResult(player.playerID, {
                                            code: TARGET_PROTECTED,
                                            payload: '',
                                        });
                                    }
                                } else {
                                    if (isTargetProtected(players, target.playerID)) {
                                        modifyActionResult(player.playerID, {
                                            code: TARGET_PROTECTED,
                                            payload: '',
                                        });
                                    } else {
                                        modifyActionResult(player.playerID, {
                                            code: KILLED,
                                            payload: '',
                                        });
                                    }
                                }
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Godfather':
                        if (target) {
                            if (isPlayerBlocked(players, mafiaGunner.playerID)) {
                                if (mafiaGunner.playerID === player.playerID) {
                                    modifyActionResult(player.playerID, {
                                        code: BLOCKED,
                                        payload: '',
                                    });
                                } else {
                                    modifyActionResult(player.playerID, {
                                        code: MAF_GUNNER_BLOCKED,
                                        payload: '',
                                    });
                                }
                            } else {
                                if (target.playerRole === 'Brawler' && target.actionOn) {
                                    if (isPlayerBlocked(players, target.playerID) === false) {
                                        if (mafiaGunner.playerID === player.playerID) {
                                            modifyActionResult(player.playerID, {
                                                code: DEATH,
                                                payload: '',
                                            });
                                        } else {
                                            modifyActionResult(player.playerID, {
                                                code: TARGET_PROTECTED,
                                                payload: '',
                                            });
                                        }
                                    }
                                } else {
                                    if (isTargetProtected(players, target.playerID)) {
                                        modifyActionResult(player.playerID, {
                                            code: TARGET_PROTECTED,
                                            payload: '',
                                        });
                                    } else {
                                        modifyActionResult(player.playerID, {
                                            code: KILLED,
                                            payload: '',
                                        });
                                    }
                                }
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: KILLED,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Goon':
                        if (target) {
                            if (isPlayerBlocked(players, mafiaGunner.playerID)) {
                                if (mafiaGunner.playerID === player.playerID) {
                                    modifyActionResult(player.playerID, {
                                        code: BLOCKED,
                                        payload: '',
                                    });
                                } else {
                                    modifyActionResult(player.playerID, {
                                        code: MAF_GUNNER_BLOCKED,
                                        payload: '',
                                    });
                                }
                            } else {
                                if (target.playerRole === 'Brawler' && target.actionOn) {
                                    if (mafiaGunner.playerID === player.playerID) {
                                        modifyActionResult(player.playerID, {
                                            code: DEATH,
                                            payload: '',
                                        });
                                    } else {
                                        modifyActionResult(player.playerID, {
                                            code: TARGET_PROTECTED,
                                            payload: '',
                                        });
                                    }
                                } else {
                                    if (isTargetProtected(players, target.playerID)) {
                                        modifyActionResult(player.playerID, {
                                            code: TARGET_PROTECTED,
                                            payload: '',
                                        });
                                    } else {
                                        modifyActionResult(player.playerID, {
                                            code: KILLED,
                                            payload: '',
                                        });
                                    }
                                }
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Escort':
                        if (isPlayerBlocked(players, player.playerID)) {
                            modifyActionResult(player.playerID, {
                                code: BLOCKED,
                                payload: '',
                            });
                        } else {
                            if (player.actionOn) {
                                modifyActionResult(player.playerID, {
                                    code: I_BLOCKED,
                                    payload: '',
                                });
                            }
                        }

                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                        break;

                    case 'Townie':
                        if (isPlayerTargeted(players, player.playerID, mafiaGunner)) {
                            if (isTargetProtected(players, player.playerID)) {
                                modifyActionResult(player.playerID, {
                                    code: DOCTOR_PROTECTED_ME,
                                    payload: '',
                                });
                            } else {
                                modifyActionResult(player.playerID, {
                                    code: DEATH,
                                    payload: '',
                                });
                            }
                        }

                    default:
                        console.error('unexpected role: ', player.playerRole);
                }
            });

            actionResults.forEach((actionResult) => {
                gameNps.to(actionResult.socketID).emit('action-result', actionResult);
            });

            const dayResult = [];

            /** If actions contains dead players, update them to dead. If actions contains players who have action limit, update their action limit */
            actionResults.forEach((actionResult) => {
                const resultCodes = actionResult.results.map((result) => result.code);

                if (resultCodes.includes(DEATH)) {
                    const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, actionResult.playerID);

                    game[gameRoomIndex].players[playerIndex].playerAlive = false;
                    dayResult.push(game[gameRoomIndex].players[playerIndex]);

                    // if (players.find((p) => p.playerID === actionResult.playerID).playerRole === 'Godfather') {

                    // }
                }

                if (resultCodes.includes(VIG_KILLED) || resultCodes.includes(BRAWLER_GUARDED) || resultCodes.includes(ACTION_USED)) {
                    const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, actionResult.playerID);

                    game[gameRoomIndex].players[playerIndex].actionCount = game[gameRoomIndex].players[playerIndex].actionCount - 1;
                }

                /** */
                function isPlayerVig(players, playerID) {
                    return players.find((player) => player.playerRole === 'Vigilante' && player.playerID === playerID);
                }

                if (resultCodes.includes(TARGET_PROTECTED) && isPlayerVig(players, actionResult.playerID)) {
                    const { playerIndex } = findPlayerIDIndexInRooms(gameRoomIndex, actionResult.playerID);

                    game[gameRoomIndex].players[playerIndex].actionCount = game[gameRoomIndex].players[playerIndex].actionCount - 1;
                }
            });

            let newPlayers = JSON.parse(JSON.stringify(players));

            /** If all mafia roles died, promote the goons to mafia (if they exist) */
            const mafiaMembers = players.filter((p) => p.playerTeam === 'MAFIA' && p.playerRole === 'Mafia' && p.playerAlive);
            if (!mafiaMembers.length) {
                newPlayers = newPlayers.map((p) => ({
                    ...p,
                    playerRole: p.playerRole === 'Goon' ? 'Mafia' : p.playerRole,
                }));
            }

            /** If godfather dies, find one member who is of role Mafia and promote them to Godfather */
            const godfather = players.find((p) => p.playerRole === 'Godfather' && p.playerAlive);
            if (!godfather) {
                const newGf = newPlayers.find((player) => player.playerRole === 'Mafia' && player.playerAlive);
                if (newGf) {
                    const playerIndex = newPlayers.findIndex((player) => player.playerID === newGf.playerID);
                    newPlayers[playerIndex].playerRole = 'Godfather';
                }
            }

            game[gameRoomIndex].players = newPlayers;

            game[gameRoomIndex].gameProgress.dayResult = dayResult;

            /** Reset the actions */
            game[gameRoomIndex].players = game[gameRoomIndex].players.map((player) => ({
                ...player,
                actionOn: '',
            }));
        }
    });

    socket.on('sync-time', (gameCode, playerID, time) => {
        console.group('sync-time');
        const gameRoomIndex = indexOfGameRoom(gameCode);
        // console.log({ gameRoomIndex });
        if (gameRoomIndex !== -1) {
            const { playersAmount } = game[gameRoomIndex];
            const { timers } = game[gameRoomIndex].gameProgress;
            // console.log({ playersAmount, timers });

            const playerIndex = timers.findIndex((timer) => timer.playerID === playerID);
            // console.log({ playerIndex });

            /** Add new timer */
            if (playerIndex === -1) {
                timers.push({
                    playerID,
                    playerTimer: time,
                });
                // console.log('pushed a new timer, new value: ', timers);
            } else {
                /** Modify the existing timer */
                timers[playerIndex].playerTimer = time;
                // console.log('modified an existing timer, new value: ', timers);
            }

            if (playersAmount === timers.length) {
                // console.log('all players emitted their timers, processing...');
                /** */
                function getAverage(times) {
                    return Math.round(times.reduce((a, b) => a + b) / times.length);
                }

                /** */
                function areTimesSynched(timers) {
                    for (let i = 0; i < timers.length; i++) {
                        const time = timers[i];

                        if (i === 0) continue;
                        else {
                            if (time !== timers[0] - 1 && time !== timers[0] + 1 && time !== timers[0]) return false;
                        }
                    }
                    return true;
                }

                const times = timers.map((timer) => timer.playerTimer);
                console.log({ times });

                if (areTimesSynched(times) === false) {
                    console.log('not all times are synched...');
                    const average = getAverage(times);
                    console.log('average: ', average);

                    gameNps.to(gameCode).emit('synced-time', average);
                    game[gameRoomIndex].gameProgress.timers = [];
                }
            }
        }

        console.groupEnd('sync-time');
    });

    socket.on('current-time', (gameCode, time) => {
        const gameRoomIndex = indexOfGameRoom(gameCode);
        if (gameRoomIndex !== -1) {
            game[gameRoomIndex].gameProgress.currentTimer = time;
        }
    });
};
