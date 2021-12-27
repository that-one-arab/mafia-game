export const initialState = {
    /** Client player */
    myPlayer: {
        playerID: '',
        playerName: '',
        playerRole: '',
        playerTeam: '',
        playerAlive: true,
    },
    /** Other players */
    players: [],
    /** Which player was selected to perfrom an action on */
    playerActionOn: 'PLAYER_ID',
    /** If the player is of team mafia, this would be populated */
    playerMafiaTeam: [],

    /** The amount of days that passed */
    daysCount: 0,

    /** Which player voted for which player */
    lynchVotes: [],

    /** Results of the game (showing the players and their roles and who won) */
    gameResults: [],
};

export const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_PLAYERS':
            return {
                ...state,
                players: action.payload,
            };

        default:
            break;
    }
};
