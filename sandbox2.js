const arr2 = [
    { playerID: 'PLR-739f61d6-9810-490c-8ee1-2e68dc5ddcd2', playerName: 'a1', isOwner: true },
    { playerID: 'PLR-07bbc1b6-21e0-47b4-971c-389b33405863', playerName: 'a3', isOwner: false },
    { playerID: 'PLR-3ad9fcf8-5eab-4abc-9e81-779a7edaf30a', playerName: 'a2', isOwner: false },
    { playerID: 'PLR-b7d98ccd-d71f-4049-bbf2-abb17b273446', playerName: 'a4', isOwner: false },
];

const arr = ['a1', 'a3', 'a2', 'a4'];

console.log(
    arr2.sort(function (a, b) {
        const nameA = a.playerName.toUpperCase();
        const nameB = b.playerName.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    })
);
