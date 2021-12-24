const { uuid } = require('../helpers');
const { Room } = require('../models');

/**
 * OBJECTIVES:
 * 1- When a user creates a room, it will be added to the lobby array           DONE
 * 2- When a user leaves a room:
 *     - If the user is the only person in the room, room will be destroyed     DONE
 *     - If the user leaving is the owner, destroy the room                     DONE
 *     - If the room has 1 or more players, only the user will be removed       DONE
 * 3- When a user joins the room
 *     - Emit event to room                                                     DONE
 */

let lobby = [];

const findSocketIDIndexInLobby = (lobbyArr, socketID) => {
    for (let i = 0; i < lobbyArr.length; i++) {
        const room = lobbyArr[i];

        if (room.players && room.players.length) {
            for (let j = 0; j < room.players.length; j++) {
                const player = room.players[j];

                if (player.socketID === socketID) {
                    // console.info(
                    //     'found socket with ID: "',
                    //     socketID,
                    //     '" At indexes: ',
                    //     i,
                    //     j
                    // );

                    return {
                        found: true,
                        lobbyIndex: i,
                        playersIndex: j,
                    };
                }
            }
        }
    }

    return {
        found: false,
    };
};

const findRoomIDIndexInLobby = (lobbyArr, roomCode) => {
    return lobbyArr.map((lobbyRoom) => lobbyRoom.roomCode).indexOf(roomCode);
};

/**
 * @param {object} lobbyRoom the lobby room object
 * @returns {object} same lobby room object, but in the players objects array, removed the socket ID property
 */
const parseLobbyRoomPayload = (lobbyRoom) => {
    if (lobbyRoom && lobbyRoom.players && lobbyRoom.players.length) {
        const parsedPlayers = lobbyRoom.players.map((player) => ({
            playerID: player.playerID,
            playerName: player.playerName,
            isOwner: player.isOwner,
        }));

        return {
            ...lobbyRoom,
            players: parsedPlayers,
        };
    }
    throw new Error('Unexpected input, expected a lobby with players array');
};

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
                console.log('Game starting condition fullfilled');

                /** Emit a message to all sockets in the room */
                lobbyNps.to(room.roomCode).emit('lobby-players', {
                    message: 'The game is about to start',
                    payload: parseLobbyRoomPayload(newLobby[lobbyIndex]),
                });
            } /** Else we proceed with joining the player to the lobby */ else {
                console.log(
                    'expecting ',
                    room.playersAmount - newLobby[lobbyIndex].players.length,
                    ' more players'
                );
                /** Emit a message to all sockets in the room */
                lobbyNps.to(room.roomCode).emit('lobby-players', {
                    message: 'A player has joined',
                    payload: parseLobbyRoomPayload(newLobby[lobbyIndex]),
                });
            }

            console.log('new lobby :', newLobby);

            /** Update lobby cache */
            lobby = newLobby;

            responseCb({
                status: 200,
                message: 'Room was found, joined socket to room',
                room,
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

    socket.on('log-server-vals', async () => {
        console.log({ lobby });
    });
};
