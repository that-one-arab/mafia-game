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
    function sortPriorityLast(arr) {
        return arr.sort((a, b) => {
            if (a.priority === 10) return 1;
            else return -1;
        });
    }

    /** */
    function spliceSeqLengthToPlayersLength(arr, team) {
        const deleteCount = arr.length - team.length;
        arr.splice(0, deleteCount);
        return arr;
    }

    /**  */
    function populateRoleSequence(team, teamRoles) {
        const rolesSequence = [];

        /** */
        function sortPriorityFirst(arr) {
            return arr.sort((a, b) => b.priority - a.priority);
        }

        const sortedByPriority = sortPriorityFirst(teamRoles);

        while (rolesSequence.length < team.length * 10) {
            sortedByPriority.forEach((role, i) => {
                if (role.unique) {
                    if (rolesSequence.map((seq) => seq.role).includes(role.name) === false) {
                        rolesSequence.push({
                            role: role.name,
                            description: role.description,
                            priority: role.priority,
                        });
                    }
                } else {
                    rolesSequence.push({
                        role: role.name,
                        description: role.description,
                        priority: role.priority,
                    });
                }
            });
        }

        return rolesSequence;
    }

    /** */
    function getMafiaTeamRoles(mafiaTeam) {
        let rolesSequence = populateRoleSequence(mafiaTeam, mafiaRoles);

        rolesSequence = shuffle(rolesSequence);

        rolesSequence = sortPriorityLast(rolesSequence);

        rolesSequence = spliceSeqLengthToPlayersLength(rolesSequence, mafiaTeam);

        return mafiaTeam.map((player, i) => ({
            playerName: player.playerName,
            playerRole: rolesSequence[i].role,
        }));
    }

    /** */
    function getTownTeamRoles(townTeam) {
        let rolesSequence = populateRoleSequence(townTeam, townRoles);

        rolesSequence = shuffle(rolesSequence);

        rolesSequence = sortPriorityLast(rolesSequence);

        rolesSequence = spliceSeqLengthToPlayersLength(rolesSequence, townTeam);

        return townTeam.map((player, i) => ({
            playerName: player.playerName,
            playerRole: rolesSequence[i].role,
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
        description: 'Can protect themselves 2 times, if attacked while protecting, they will kill the attacker',
    },
    {
        name: 'Copper',
        team: TOWN,
        description: 'May choose one player to block them from using their ability',
    },
];

const mafiaRoles = [
    {
        name: 'Mafia',
        team: MAFIA,
        description: 'Regular mafia-aligned role. May kill one person each night',
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
        description: 'May choose one player to block them from using their ability',
        priority: 3,
        unique: false,
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
    {
        playerName: 'Ahmed',
    },
    {
        playerName: 'Michael',
    },
    {
        playerName: 'Lewis',
    },
    {
        playerName: 'Antonio',
    },
    {
        playerName: 'Roger',
    },
    {
        playerName: 'Harry',
    },
    {
        playerName: 'Gilbert',
    },
    {
        playerName: 'Asshole',
    },
    {
        playerName: 'Felix',
    },
    {
        playerName: 'Historia',
    },
    {
        playerName: 'Ali',
    },
    {
        playerName: 'Amina',
    },
    {
        playerName: 'Adem',
    },
    {
        playerName: 'Sudad',
    },
    {
        playerName: 'Johnson',
    },
];

players = shuffle(players);

const teams = assignTeams(players);

const roles = assignRoles(teams);
console.log('roles :', roles);
