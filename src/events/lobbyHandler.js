const { Room } = require('../models');

/**
 * OBJECTIVES:
 * 1- When a user creates a room, it will be added to the lobby array           DONE
 * 2- When a user leaves a room:
 *     - If the user is the only person in the room, room will be destroyed     DONE
 *     - If the room has 1 or more players, only the user will be removed
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

module.exports = (lobbyNps, socket) => {
    const createRoomHandler = async (roomCode, responseCb) => {
        /** If room already exists (unlikely to happen why did I do this lol) */
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
        // console.log('fetching room with roomCode: "', roomCode, '"...');
        const room = await Room.findOne({ roomCode });
        if (!room) {
            console.warn('room with roomCode: "', roomCode, '" was not found!');
            responseCb({
                status: 400,
                message: 'room was not found',
                room: null,
            });
        }
        // console.log('room was fetched, room :', room);

        socket.join(room.roomCode);
        // console.log('created socket room with code :', room.roomCode);

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
    };

    const joinRoomHandler = async (
        roomCode,
        playerID,
        playerName,
        responseCb
    ) => {
        console.log('join-room event fired');
        // console.log('fetching room with roomCode: "', roomCode, '"...');
        const room = await Room.findOne({ roomCode });
        console.log({ room });
        if (!room) {
            console.warn('room with roomCode: "', roomCode, '" was not found!');
            responseCb({
                status: 400,
                message: 'room was not found',
                room: null,
            });
        }
        // console.log('room was fetched, room :', room);

        socket.join(room.roomCode);

        const lobbyRoomIndex = lobby
            .map((lobbyRoom) => lobbyRoom.roomCode)
            .indexOf(roomCode);
        console.log('room index :', lobbyRoomIndex);

        console.log('current room :', lobby[lobbyRoomIndex]);

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
    };

    const leaveRoomHandler = (room, id) => {
        const { found, lobbyIndex, playersIndex } = findSocketIDIndexInLobby(
            lobby,
            id
        );

        const newLobby = JSON.parse(JSON.stringify(lobby));

        if (found) {
            /** If only one player remains in the room, remove the room from lobby */
            if (newLobby[lobbyIndex].players.length === 1) {
                newLobby.splice(lobbyIndex, 1);
            } /** Else only remove the player who left */ else {
                newLobby[lobbyIndex].players.splice(playersIndex, 1);
            }

            lobby = newLobby;
        }
    };

    console.log('A socket connected to the lobby namespace');

    lobbyNps.adapter.on('leave-room', leaveRoomHandler);

    socket.on('join-room', joinRoomHandler);

    socket.on('create-room', createRoomHandler);

    socket.on('log-server-vals', () => {
        console.log({ lobby });
    });
};
