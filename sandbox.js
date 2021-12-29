/**
 * 
LENGTHS:
    3 Players:
        1 Mafia
        2 Villagers

    4 Players
        1 Mafia
        3 Villagers

    5 Players
        1 Mafia
        4 Villagers

    6 Players
        2 Mafia
        4 Villagers

    7 Players
        2 Mafia
        5 Villagers

    8 Players
        3 Mafia
        5 Villagers

    9 Players
        3 Mafia
        6 Villagers
 */

const roles = [
    {
        role: 'doctor',
        team: 'village',
    },
    {
        role: 'investigator',
        team: 'village',
    },
    {
        role: 'villager',
        team: 'village',
    },
    {
        role: 'mafioso',
        team: 'mafia',
    },
    {
        role: 'godfather',
        team: 'mafia',
    },
];
const teams = ['village', 'mafia'];

let players = [
    {
        name: 'Sam',
    },
    {
        name: 'Mike',
    },
    {
        name: 'Alex',
    },
    {
        name: 'Katy',
    },
    {
        name: 'Romeo',
    },
];

/** */
function shuffle(array) {
    let currentIndex = array.length;
    let randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }

    return array;
}

players = shuffle(players);

const assignTeams = (players) => {
    let mafTeam = [];
    let villTeam = [];

    if (players.length <= 5) {
        mafTeam.push(players[0]);
        villTeam = players.slice(1);
    } else {
    }

    return { mafTeam, villTeam };
};

console.log(assignTeams(players));
