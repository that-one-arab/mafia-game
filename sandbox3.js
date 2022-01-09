const timer1 = 34;
const timer2 = 35;
const timer3 = 33;
const timer4 = 33;

/** */
function getAverage(...timers) {
    const times = [...timers];

    return times.reduce((a, b) => a + b) / times.length;
}

/** */
function areTimesSynched(timers) {
    for (let i = 0; i < timers.length; i++) {
        const time = timers[i];

        if (i === 0) continue;
        else {
            if (time !== timers[0] - 1 && time !== timers[0] + 1 && time !== timers[0]) return false;
        }
    }
    return true;
}

console.log(areTimesSynched([timer1, timer2, timer3, timer4]));
// console.log(getAverage(timer1, timer2, timer3, timer4));
