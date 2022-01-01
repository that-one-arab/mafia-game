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
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

/** */
function assignTeams(players) {
    let mafiaTeam = [];
    let townTeam = [];

    if (players.length <= 5) {
        mafiaTeam.push(players[0]);
        townTeam = players.slice(1);
    } else {
        const playersCount = players.length;

        if ((playersCount / 3) % 1 === 0) {
            const mafiaCount = playersCount / 3;
            const sliceIndex = mafiaCount;
            mafiaTeam = players.slice(0, sliceIndex);

            townTeam = players.slice(sliceIndex);

            return { mafiaTeam, townTeam };
        } else {
            const mafiaCount = playersCount / 3;
            const sliceIndex = Math.trunc(mafiaCount);
            mafiaTeam = players.slice(0, sliceIndex);

            townTeam = players.slice(sliceIndex);

            return { mafiaTeam, townTeam };
        }
    }

    return { mafiaTeam, townTeam };
}

/** */
function assignRoles(teams) {
    /** */
    function generateRoleSequence(roles, length) {
        const results = [];
        let sum = 0;
        for (const elem of roles) sum += elem.frequency;

        while (results.length < length) {
            let rand = Math.random() * sum;

            for (const elem of roles) {
                if (rand < elem.frequency) {
                    if (elem.unique) {
                        if (results.map((seq) => seq.name).includes(elem.name) === false) {
                            results.push(elem);
                            break;
                        }
                    } else {
                        results.push(elem);
                        break;
                    }
                }
                rand -= elem.frequency;
            }
        }

        return results;
    }

    /** */
    function verifyRequiredRoles(seq, roles) {
        const res = seq;
        const selectedRoles = seq.map((role) => role.name);

        roles.forEach((role, i) => {
            if (role.required && !selectedRoles.includes(role.name)) {
                res.shift();
                res.push(role);
            }
        });

        return res;
    }

    /** */
    function getMafiaTeamRoles(mafiaTeam) {
        let rolesSequence = generateRoleSequence(mafiaRoles, mafiaTeam.length);

        rolesSequence = verifyRequiredRoles(rolesSequence, mafiaRoles);

        return mafiaTeam.map((player, i) => ({
            playerName: player.playerName,
            playerRole: rolesSequence[i].name,
        }));
    }

    /** */
    function getTownTeamRoles(townTeam) {
        let rolesSequence = generateRoleSequence(townRoles, townTeam.length);

        rolesSequence = verifyRequiredRoles(rolesSequence, townRoles);

        return townTeam.map((player, i) => ({
            playerName: player.playerName,
            playerRole: rolesSequence[i].name,
        }));
    }

    const mafiaTeam = getMafiaTeamRoles(teams.mafiaTeam);
    const townTeam = getTownTeamRoles(teams.townTeam);
    return { mafiaTeam, townTeam };
}

const TOWN = 'TOWN';
const MAFIA = 'MAFIA';

const townRoles = [
    {
        name: 'Doctor',
        team: TOWN,
        description: 'May protect one person from being killed each night. May not protect himself',
        frequency: 2,
        unique: false,
        required: true,
    },
    {
        name: 'Detective',
        team: TOWN,
        description: 'May detect one person each night, learning their role.',
        frequency: 2,
        unique: false,
        required: true,
    },
    {
        name: 'Vigilante',
        team: TOWN,
        description:
            'May kill one person each night but has 3 bullet limit. If the person they kill is a townie they will commit suicide the next day out of guilt',
        frequency: 2,
        unique: false,
        required: false,
    },
    {
        name: 'Townie',
        team: TOWN,
        description: 'Regular town-aligned role with no special ability.',
        frequency: 9,
        unique: false,
        required: false,
    },
    {
        name: 'Bodyguard',
        team: TOWN,
        description: 'Can protect themselves 2 times, if attacked while protecting, they will kill the attacker',
        frequency: 2,
        unique: false,
        required: false,
    },
    {
        name: 'Copper',
        team: TOWN,
        description: 'May choose one player to block them from using their ability',
        frequency: 2,
        unique: false,
        required: false,
    },
];

const mafiaRoles = [
    {
        name: 'Mafia',
        team: MAFIA,
        description: 'Regular mafia-aligned role. May kill one person each night',
        frequency: 3,
        unique: false,
        required: true,
    },
    {
        name: 'Godfather',
        team: MAFIA,
        description: 'Head of the mafia. If detected, comes up as "Townie".',
        frequency: 9,
        unique: true,
        required: true,
    },
    {
        name: 'Goon',
        team: MAFIA,
        description: 'Regular mafia-aligned role with no special ability.',
        frequency: 8,
        unique: false,
        required: false,
    },
    {
        name: 'Escort',
        team: MAFIA,
        description: 'May choose one player to block them from using their ability',
        frequency: 2.5,
        unique: false,
        required: false,
    },
];

let players = [
    {
        playerName: 'Sam',
    },
    {
        playerName: 'Mike',
    },
    {
        playerName: 'Alex',
    },
    {
        playerName: 'Katy',
    },
    {
        playerName: 'Romeo',
    },
    {
        playerName: 'Julliete',
    },
    {
        playerName: 'Sandy',
    },
    {
        playerName: 'Will',
    },
    {
        playerName: 'Sofia',
    },
    {
        playerName: 'Rami',
    },
    // {
    //     playerName: 'Ahmed',
    // },
    // {
    //     playerName: 'Michael',
    // },
    // {
    //     playerName: 'Lewis',
    // },
    // {
    //     playerName: 'Antonio',
    // },
    // {
    //     playerName: 'Roger',
    // },
    // {
    //     playerName: 'Harry',
    // },
    // {
    //     playerName: 'Gilbert',
    // },
    // {
    //     playerName: 'Asshole',
    // },
    // {
    //     playerName: 'Felix',
    // },
    // {
    //     playerName: 'Historia',
    // },
    // {
    //     playerName: 'Ali',
    // },
    // {
    //     playerName: 'Amina',
    // },
    // {
    //     playerName: 'Adem',
    // },
    // {
    //     playerName: 'Sudad',
    // },
    // {
    //     playerName: 'Johnson',
    // },
];

players = shuffle(players);

const teams = assignTeams(players);

const roles = assignRoles(teams);
console.log('roles :', roles);

/** */
function roleStats(roles) {
    const mafiaRoleCount = [];
    const townRoleCount = [];

    const { mafiaTeam, townTeam } = roles;
    townTeam.forEach((player) => {
        if (townRoleCount.length && townRoleCount.map((obj) => obj.role).includes(player.playerRole)) {
            townRoleCount[townRoleCount.findIndex((obj) => obj.role === player.playerRole)].count++;
        } else {
            townRoleCount.push({ role: player.playerRole, count: 1 });
        }
    });

    mafiaTeam.forEach((player) => {
        if (mafiaRoleCount.length && mafiaRoleCount.map((obj) => obj.role).includes(player.playerRole)) {
            mafiaRoleCount[mafiaRoleCount.findIndex((obj) => obj.role === player.playerRole)].count++;
        } else {
            mafiaRoleCount.push({ role: player.playerRole, count: 1 });
        }
    });

    mafiaRoleCount.sort((a, b) => b.count - a.count);

    townRoleCount.sort((a, b) => b.count - a.count);

    return { townRoleCount, mafiaRoleCount };
}

console.log(roleStats(roles));
