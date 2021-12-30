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
        2 Mafia
        6 Villagers

    9 Players
        3 Mafia
        6 Villagers

    10 Players
        3 Mafia
        7 Villagers

    11 Players
        3 Mafia
        8 Villagers

    12 Players
        4 Mafia
        8 Villagers
 */

const TOWN = 'TOWN';
const MAFIA = 'MAFIA';

const townRoles = [
    {
        name: 'Doctor',
        team: TOWN,
        description:
            'May protect one person from being killed each night. May not protect himself',
    },
    {
        name: 'Detective',
        team: TOWN,
        description: 'May detect one person each night, learning their role.',
    },
    {
        name: 'Vigilante',
        team: TOWN,
        description:
            'May kill one person each night but has 3 bullet limit. If the person they kill is a townie they will commit suicide the next day out of guilt',
    },
    {
        name: 'Townie',
        team: TOWN,
        description: 'Regular town-aligned role with no special ability.',
    },
    {
        name: 'Bodyguard',
        team: TOWN,
        description:
            'Can protect themselves 2 times, if attacked while protecting, they will kill the attacker',
    },
    {
        name: 'Copper',
        team: TOWN,
        description:
            'May choose one player to block them from using their ability',
    },
];

const mafiaRoles = [
    {
        name: 'Mafia',
        team: MAFIA,
        description:
            'Regular mafia-aligned role. May kill one person each night',
        priority: 7,
        unique: false,
    },
    {
        name: 'Godfather',
        team: MAFIA,
        description: 'Head of the mafia. If detected, comes up as "Townie".',
        priority: 10,
        unique: true,
    },
    {
        name: 'Goon',
        team: MAFIA,
        description: 'Regular mafia-aligned role with no special ability.',
        priority: 5,
        unique: false,
    },
    {
        name: 'Escort',
        team: MAFIA,
        description:
            'May choose one player to block them from using their ability',
        priority: 3,
        unique: false,
    },
];

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
        const playersCount = players.length;

        if ((playersCount / 3) % 1 === 0) {
            const mafiaCount = playersCount / 3;
            const sliceIndex = mafiaCount;
            mafTeam = players.slice(0, sliceIndex);

            villTeam = players.slice(sliceIndex);

            return { mafTeam, villTeam };
        } else {
            const mafiaCount = playersCount / 3;
            const sliceIndex = Math.trunc(mafiaCount);
            mafTeam = players.slice(0, mafiaCount);

            villTeam = players.slice(mafiaCount);

            return { mafTeam, villTeam };
        }
    }

    return { mafTeam, villTeam };
};

const teams = assignTeams(players);
// console.log(assignTeams(players));

/** */
function assignRoles({ mafTeam }) {
    console.log({ mafTeam });
    let mafPlayers = [];
    let rolesSequence = [];

    const mafiaRolesSortedByPriority = mafiaRoles.sort(
        (a, b) => b.priority - a.priority
    );

    /**  */
    function populateRoleSequence() {
        mafiaRolesSortedByPriority.forEach((role, i) => {
            if (role.unique) {
                console.log(
                    'role :',
                    role.name,
                    ' at index: ',
                    i,
                    ' is unique.'
                );
                if (
                    rolesSequence.map((seq) => seq.role).includes(role.name) ===
                    false
                ) {
                    rolesSequence.push({
                        role: role.name,
                        description: role.description,
                    });
                }
            } else {
                rolesSequence.push({
                    role: role.name,
                    description: role.description,
                });
            }
        });

        if (rolesSequence.length < mafTeam.length * 4) populateRoleSequence();
    }

    populateRoleSequence();

    console.log('rolesSequence length before: ', rolesSequence.length);
    const start = 0;
    console.log({ start });
    const deleteCount = rolesSequence.length - mafTeam.length;
    console.log({ deleteCount });
    rolesSequence.splice(0, deleteCount);
    console.log('rolesSequence after: ', rolesSequence.length);

    return { mafPlayers, rolesSequence };
}

const mafTeam = [
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
    {
        name: 'Julliete',
    },
    {
        name: 'Sofia',
    },
    {
        name: 'Sally',
    },
    {
        name: 'Mark',
    },
];

console.log(assignRoles({ mafTeam }));
