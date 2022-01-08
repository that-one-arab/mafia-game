/** */
const isEqual = function (value, other) {
    // Get the value type
    const type = Object.prototype.toString.call(value);

    // If the two objects are not the same type, return false
    if (type !== Object.prototype.toString.call(other)) {
        console.log('err 1');
        return false;
    }

    // If items are not an object or array, return false
    if (['[object Array]', '[object Object]'].indexOf(type) < 0) {
        console.log('err 2');
        return false;
    }

    // Compare the length of the length of the two items
    const valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
    const otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
    if (valueLen !== otherLen) {
        console.log('err 3');
        return false;
    }

    // Compare two items
    const compare = function (item1, item2) {
        // Get the object type
        const itemType = Object.prototype.toString.call(item1);

        // If an object or array, compare recursively
        if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
            if (!isEqual(item1, item2)) {
                console.log('err 4');
                return false;
            }
        }

        // Otherwise, do a simple comparison
        else {
            // If the two items are not the same type, return false
            if (itemType !== Object.prototype.toString.call(item2)) {
                console.log('err 5');
                return false;
            }

            // Else if it's a function, convert to a string and compare
            // Otherwise, just compare
            if (itemType === '[object Function]') {
                if (item1.toString() !== item2.toString()) {
                    console.log('err 6');
                    return false;
                }
            } else {
                if (item1 !== item2) {
                    console.log('err 7');
                    return false;
                }
            }
        }
    };

    // Compare properties
    if (type === '[object Array]') {
        for (let i = 0; i < valueLen; i++) {
            if (compare(value[i], other[i]) === false) {
                console.log('err 8');
                return false;
            }
        }
    } else {
        for (const key in value) {
            if (value.hasOwnProperty(key)) {
                if (compare(value[key], other[key]) === false) {
                    console.log('err 9');
                    return false;
                }
            }
        }
    }

    // If nothing failed, return true
    return true;
};

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
        } else {
            const mafiaCount = playersCount / 3;
            const sliceIndex = Math.trunc(mafiaCount);
            mafiaTeam = players.slice(0, sliceIndex);

            townTeam = players.slice(sliceIndex);
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
        let selectedRoles;

        roles.forEach((role, i) => {
            selectedRoles = res.map((role) => role.name);
            if (role.required && !selectedRoles.includes(role.name)) {
                res.shift();
                res.push(role);
            }
        });

        /** Sanity check */
        selectedRoles = res.map((role) => role.name);

        for (let i = 0; i < roles.length; i++) {
            if (roles[i].required && !selectedRoles.includes(roles[i].name)) {
                console.error('seq: ', seq, ' did not include the role: ', roles[i].name);

                if (res.length === 1) {
                    /** A special condition where if it's a 4/5 players game, there is only one mafia, and that mafia role needs to be the godfather */
                    res.splice(
                        res.findIndex((role) => role.name === 'Mafia'),
                        1,
                        roles.find((role) => role.name === 'Godfather')
                    );

                    console.log('replaced Mafia with Godfather');
                }
            }
        }

        return res;
    }

    /** */
    function getMafiaTeamRoles(mafiaTeam) {
        let rolesSequence = generateRoleSequence(mafiaRoles, mafiaTeam.length);

        rolesSequence = verifyRequiredRoles(rolesSequence, mafiaRoles);

        const tempRoles = [
            {
                name: 'Godfather',
                team: MAFIA,
                description: 'Head of the mafia. If detected, comes up as "Townie". During night, kill decision goes to you',
                frequency: 9,
                unique: true,
                required: true,
                actionCount: 'NONE',
            },
        ];
        return mafiaTeam.map((player, i) => ({
            ...player,
            playerRole: tempRoles[i].name,
            playerTeam: tempRoles[i].team,
            actionCount: tempRoles[i].actionCount,
        }));

        // return mafiaTeam.map((player, i) => ({
        //     ...player,
        //     playerRole: rolesSequence[i].name,
        //     playerTeam: rolesSequence[i].team,
        //     actionCount: rolesSequence[i].actionCount,
        // }));
    }

    /** */
    function getTownTeamRoles(townTeam) {
        let rolesSequence = generateRoleSequence(townRoles, townTeam.length);

        rolesSequence = verifyRequiredRoles(rolesSequence, townRoles);

        const tempRoles = [
            {
                name: 'Townie',
                team: TOWN,
                description: 'Regular town-aligned role with no special ability.',
                frequency: 9,
                unique: false,
                required: false,
                actionCount: 'NONE',
            },
            {
                name: 'Brawler',
                team: TOWN,
                description: 'Can protect themselves 2 times, if attacked while protecting, they will kill the attacker',
                frequency: 2,
                unique: false,
                required: false,
                actionCount: 2,
            },
            {
                name: 'Mermaid',
                team: TOWN,
                description: 'May choose one player to block them from using their ability',
                frequency: 2,
                unique: false,
                required: false,
                actionCount: 'NONE',
            },
        ];
        return townTeam.map((player, i) => ({
            ...player,
            playerRole: tempRoles[i].name,
            playerTeam: tempRoles[i].team,
            actionCount: tempRoles[i].actionCount,
        }));

        // return townTeam.map((player, i) => ({
        //     ...player,
        //     playerRole: rolesSequence[i].name,
        //     playerTeam: rolesSequence[i].team,
        //     actionCount: rolesSequence[i].actionCount,
        // }));
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
        actionCount: 'NONE',
    },
    {
        name: 'Sherrif',
        team: TOWN,
        description: 'May investigate one person each night, knowing if they are mafia or not',
        frequency: 2,
        unique: false,
        required: true,
        actionCount: 'NONE',
    },
    {
        name: 'Detective',
        team: TOWN,
        description: 'May detect one person each night, learning their role.',
        frequency: 2,
        unique: false,
        required: true,
        actionCount: 'NONE',
    },
    {
        name: 'Vigilante',
        team: TOWN,
        description:
            'May kill one person each night but has 3 bullet limit. If the person they kill is a townie they will commit suicide the next day out of guilt',
        frequency: 2,
        unique: false,
        required: false,
        actionCount: 2,
    },
    {
        name: 'Townie',
        team: TOWN,
        description: 'Regular town-aligned role with no special ability.',
        frequency: 9,
        unique: false,
        required: false,
        actionCount: 'NONE',
    },
    {
        name: 'Brawler',
        team: TOWN,
        description: 'Can protect themselves 2 times, if attacked while protecting, they will kill the attacker',
        frequency: 2,
        unique: false,
        required: false,
        actionCount: 2,
    },
    {
        name: 'Mermaid',
        team: TOWN,
        description: 'May choose one player to block them from using their ability',
        frequency: 2,
        unique: false,
        required: false,
        actionCount: 'NONE',
    },
];

const mafiaRoles = [
    {
        name: 'Mafia',
        team: MAFIA,
        description: 'Regular mafia-aligned role. May kill one person each night. If godfather died, can be promoted to take their place',
        frequency: 3,
        unique: false,
        required: true,
        actionCount: 'NONE',
    },
    {
        name: 'Godfather',
        team: MAFIA,
        description: 'Head of the mafia. If detected, comes up as "Townie". During night, kill decision goes to you',
        frequency: 9,
        unique: true,
        required: true,
        actionCount: 'NONE',
    },
    {
        name: 'Goon',
        team: MAFIA,
        description: 'Regular mafia-aligned role with no special ability.',
        frequency: 8,
        unique: false,
        required: false,
        actionCount: 'NONE',
    },
    {
        name: 'Escort',
        team: MAFIA,
        description: 'May choose one player to block them from using their ability',
        frequency: 2.5,
        unique: false,
        required: false,
        actionCount: 'NONE',
    },
];

const assignPlayers = (players) => {
    const shuffledPlayers = shuffle(players);

    const teams = assignTeams(shuffledPlayers);

    const roles = assignRoles(teams);

    const { mafiaTeam, townTeam } = roles;

    return [...mafiaTeam, ...townTeam];
};

module.exports = { isEqual, assignPlayers, shuffle };
