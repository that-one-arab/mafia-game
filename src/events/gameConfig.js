const game = [
    {
        gameCode: '',
        playersAmount: 0,
        players: [
            {
                socketID: '',
                playerID: '',
                playerName: '',
                playerRole: '',
                playerTeam: '',
                playerAlive: true,
            },
        ],
    },
];

const playerActions = [
    {
        gameCode: '',
        players: [
            {
                socketID: '',
                playerID: '',
                actionOn: 'PLAYER_ID',
            },
        ],
    },
];

const roles = ['doctor', 'mafioso', 'godfather', 'investigator', 'villager'];
const teams = ['mafia', 'village'];

const dayTimer = 40;
const voteTimer = 15;
const nightTimer = 10;

module.exports = {
    game,
    playerActions,
    roles,
    teams,
    dayTimer,
    voteTimer,
    nightTimer,
};
