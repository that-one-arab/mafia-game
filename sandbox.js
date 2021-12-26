/** */
function solution(number) {
    if (!number) return 0;
    // Find multiples of 3 below number
    const multiplesOf3 = [];
    let indexOf3 = 1;
    do {
        multiplesOf3.push(indexOf3 * 3);
        indexOf3++;
    } while (indexOf3 * 3 < number);
    console.log({ multiplesOf3 });
    // Find multiples of 5 below number
    const multiplesOf5 = [];
    let indexOf5 = 1;
    do {
        multiplesOf5.push(indexOf5 * 5);
        indexOf5++;
    } while (indexOf5 * 5 < number);
    console.log({ multiplesOf5 });
    // Get the sum of the multiples
    const sum = [...multiplesOf3, ...multiplesOf5].reduce(
        (prevVal, currentVal) => prevVal + currentVal
    );
    console.log('sum :', sum);
    // return result
    return sum;
}

solution(10);
