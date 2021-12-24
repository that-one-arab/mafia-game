const { Room } = require('../models');
const { lobbyInterface } = require('../state');

let lobby = [];

module.exports = {
    joinRoomHandler: async (roomCode, playerID, playerName, responseCb) => {
        console.log('join-room event fired');
        console.log('fetching room with roomCode: "', roomCode, '"...');
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
    },

    createRoomHandler: async (roomCode, responseCb) => {
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
            console.warn('room with roomCode: "', roomCode, '" was not found!');
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
    },
};
