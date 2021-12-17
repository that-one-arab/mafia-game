import { createStore } from 'redux';

const initialState = {
    player: {
        name: '',
    },
    gameOptions: {
        playersAmount: 0,
    },
    joinedPlayers: [],
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

        default:
            return state;
    }
};

export const store = createStore(reducer);
