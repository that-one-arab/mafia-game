import { createStore } from 'redux';

const initialState = {
    player: {
        name: '',
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

        default:
            break;
    }
};

export const store = createStore(reducer);
