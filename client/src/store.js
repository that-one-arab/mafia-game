import { createStore } from 'redux';

const initialState = {
    player: {
        name: '',
        ID: '',
    },
    gameOptions: {
        playersAmount: 0,
    },
    game: {
        roomCode: '',
        isRoomVerified: false,
        joinedPlayers: [],
        roomOwner: {},
    },
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PLAYER_NAME':
            const playerNameInput = action.payload;
            return {
                ...state,
                player: {
                    ...state.player,
                    name: playerNameInput,
                },
            };

        case 'SET_PLAYERS_AMOUNT':
            const playersAmountInput = action.payload;
            return {
                ...state,
                gameOptions: {
                    ...state.gameOptions,
                    playersAmount: playersAmountInput,
                },
            };

        case 'SET_ROOM_CODE':
            const roomCodePayload = action.payload;
            return {
                ...state,
                game: {
                    ...state.game,
                    roomCode: roomCodePayload,
                },
            };

        case 'SET_ROOM_OWNER':
            return {
                ...state,
                game: {
                    ...state.game,
                    roomOwner: action.payload,
                },
            };

        case 'SET_PLAYER_ID':
            const playerIDPayload = action.payload;
            return {
                ...state,
                player: {
                    ...state.player,
                    ID: playerIDPayload,
                },
            };

        case 'SET_ROOM_VERIFIED':
            return {
                ...state,
                game: {
                    ...state.game,
                    isRoomVerified: true,
                },
            };

        default:
            return state;
    }
};

export const store = createStore(reducer);
