const roles = [
    { frequency: 2, name: 'Banana' },
    { frequency: 9, name: 'Apple' },
    { frequency: 0.1, name: 'Orange' },
];

/** */
function generateRoleSequence(roles, length) {
    const results = [];
    let sum = 0;
    for (const elem of roles) sum += elem.frequency;

    console.log('sum :', sum);

    while (results.length < length) {
        let rand = Math.random() * sum;
        console.log('rand :', rand);

        for (const elem of roles) {
            console.log('    looping through item :', elem);
            if (rand < elem.frequency) {
                console.log('    rand is smaller than elem.frequency :', elem.frequency);
                console.log('    pushing element :', elem);
                results.push(elem);
                break;
            }
            console.log('    rand:', rand, ' - elem.frequency: ', elem.frequency, ' = ', rand - elem.frequency);
            rand -= elem.frequency;
        }
    }

    return results;
}

console.log(generateRoleSequence(roles, 20));
