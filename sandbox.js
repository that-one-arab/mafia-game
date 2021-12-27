/** */
const number = function (busStops) {
    if (busStops.length === 1) return busStops[0][0] + busStops[0][1];
    return busStops.reduce((prevVal, currentVal) => {
        if (Array.isArray(prevVal))
            return prevVal[0] - prevVal[1] + (currentVal[0] - currentVal[1]);
        return prevVal + (currentVal[0] - currentVal[1]);
    });
};

console.log(number([[0, 0]]));
