module.exports = {
    findSocketIDIndexInLobby: (lobbyArr, socketID) => {
        for (let i = 0; i < lobbyArr.length; i++) {
            const room = lobbyArr[i];

            if (room.players && room.players.length) {
                for (let j = 0; j < room.players.length; j++) {
                    const player = room.players[j];

                    if (player.socketID === socketID) {
                        return {
                            found: true,
                            lobbyRoomIndex: i,
                            playerIndex: j,
                        };
                    }
                }
            }
        }

        return {
            found: false,
        };
    },

    findRoomIDIndexInLobby: (lobbyArr, lobbyCode) => {
        return lobbyArr.map((lobbyRoom) => lobbyRoom.lobbyCode).indexOf(lobbyCode);
    },
};
