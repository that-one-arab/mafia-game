export const initialState = {
    /** Client player */
    myPlayer: {
        playerID: '',
        playerName: '',
        playerRole: '',
        playerTeam: '',
        playerAlive: true,
    },
    gameProgress: {
        isRoleAssigned: false,
        hasGameStarted: false,
        gamePhase: undefined,
        /** The amount of days that passed */
        dayCount: 0,

        /** Which player voted for which player */
        lynchVotes: [],
        currentTimer: 0,
    },
    gameEnded: undefined,
    /** Other players */
    players: [],
    /** Which player was selected to perfrom an action on */
    playerActionOn: 'PLAYER_ID',
    /** If the player is of team mafia, this would be populated */
    playerMafiaTeam: [],
};

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PLAYERS':
            return {
                ...state,
                players: action.payload,
            };

        case 'SET_PLAYER':
            return {
                ...state,
                myPlayer: {
                    /** Sanity check */
                    ...state.myPlayer,
                    ...action.payload,
                },
            };

        case 'ROLE_ASSIGNED':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    isRoleAssigned: true,
                },
            };

        case 'SET_GAME_PROGRESS':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    ...action.payload,
                },
            };

        case 'SET_DAY_COUNT':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    dayCount: action.payload,
                },
            };

        case 'TRANSITION_TO':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    gamePhase: action.payload,
                },
            };

        case 'SET_GAME_PROPS':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    ...action.payload.gameProgress,
                },
                players: action.payload.players,
            };

        case 'GAME_ENDED':
            return {
                ...state,
                gameEnded: action.payload,
            };

        case 'PAUSE_GAME':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    gamePaused: action.payload,
                },
            };

        case 'CLEANUP_TIMER':
            return {
                ...state,
                gameProgress: {
                    ...state.gameProgress,
                    currentTimer: 0,
                },
            };

        default:
            return state;
    }
};
