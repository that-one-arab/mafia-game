import { createStore } from 'redux';

const initialState = {
    myPlayer: {
        playerName: '',
        playerID: '',
        socketID: '',
        isOwner: false,
    },
    gameOptions: {
        playersAmount: 0,
    },
    lobby: {
        lobbyCode: '',
        players: [],
    },
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PLAYER_NAME':
            return {
                ...state,
                myPlayer: {
                    ...state.myPlayer,
                    playerName: action.payload,
                },
            };

        case 'SET_PLAYERS_AMOUNT':
            return {
                ...state,
                gameOptions: {
                    ...state.gameOptions,
                    playersAmount: action.payload,
                },
            };

        case 'SET_LOBBY_CODE':
            return {
                ...state,
                lobby: {
                    ...state.lobby,
                    lobbyCode: action.payload,
                },
            };

        case 'SET_ROOM_OWNER_TRUE':
            return {
                ...state,
                myPlayer: {
                    ...state.myPlayer,
                    isOwner: true,
                },
            };

        case 'SET_ROOM_OWNER_FALSE':
            return {
                ...state,
                myPlayer: {
                    ...state.myPlayer,
                    isOwner: false,
                },
            };

        case 'SET_PLAYER_ID':
            const playerIDPayload = action.payload;
            return {
                ...state,
                myPlayer: {
                    ...state.myPlayer,
                    playerID: playerIDPayload,
                },
            };

        // case 'SET_ROOM_VERIFIED':
        //     return {
        //         ...state,
        //         game: {
        //             ...state.game,
        //             isRoomVerified: true,
        //         },
        //     };

        case 'SET_PLAYERS':
            return {
                ...state,
                lobby: {
                    ...state.lobby,
                    players: action.payload,
                },
            };

        default:
            return state;
    }
};

export const store = createStore(reducer);
