module.exports = {
    findSocketIDIndexInLobby: (lobbyArr, socketID) => {
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
    },

    findRoomIDIndexInLobby: (lobbyArr, roomCode) => {
        return lobbyArr
            .map((lobbyRoom) => lobbyRoom.roomCode)
            .indexOf(roomCode);
    },

    // This is the same function as the one above, might give second arg an options object and combine it into one
    findPlayerIDIndexInLobby: (lobbyArr, playerID) => {
        for (let i = 0; i < lobbyArr.length; i++) {
            const room = lobbyArr[i];
            // console.log('looping through room :', room);

            if (room.players && room.players.length) {
                for (let j = 0; j < room.players.length; j++) {
                    const player = room.players[j];
                    // console.log('looping through player :', player);

                    if (player.playerID === playerID) {
                        // console.log('found match :', playerID);
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
    },

    /**
     * @param {object} lobbyRoom the lobby room object
     * @returns {object} same lobby room object, but in the players objects array, removed the socket ID property
     */
    parseLobbyRoomPayload: (lobbyRoom) => {
        if (lobbyRoom && lobbyRoom.players && lobbyRoom.players.length) {
            const parsedPlayers = lobbyRoom.players.map((player) => ({
                ...player,
                playerID: player.playerID,
                playerName: player.playerName,
                isOwner: player.isOwner,
            }));

            return {
                ...lobbyRoom,
                players: parsedPlayers,
            };
        }
        throw new Error(
            'Unexpected input, expected a lobby with players array'
        );
    },
};
