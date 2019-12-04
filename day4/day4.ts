const range = {
    min: 168630,
    max: 718098
};

// Given an integer n, returns the lowest integer m such that m > n
// and each digit of m is equal to or greater than the previous digit
function getNextAscendingNumber(start: number): number {
    let digits: number[] = start.toString().split("").map(x => parseInt(x));
    let max: number = 0;
    for (let i = 0; i < digits.length; i++) {
        if (digits[i] > max) max = digits[i];
        if (max > digits[i]) digits[i] = max;
    }
    let result: number = parseInt(digits.join(""));
    if (result === start) {
        if (max === 9) {
            let index: number;
            for (index = digits.length - 1; index >= 0; index--) {
                if (digits[index] < max) break;
            }
            if (index === -1) return -1;
            digits[index]++;
            let num: number = parseInt(digits.slice(0, index + 1).join(""));
            result = getNextAscendingNumber(num * (10 ** (digits.length - index - 1)));
        } else {
            digits[digits.length - 1]++;
            return parseInt(digits.join(""));
        }
    }
    return result;
}

function getHasDoubleDigits(n: number): boolean {
    // part 1:
    // return /(\d)\1/.test(n.toString());

    // part 2:
    let digits: string[] = n.toString().split("");
    let count: number = 0;
    let current: string;
    for (let i = 0; i < digits.length; i++) {
        if (digits[i] !== current) {
            if (count === 2) return true;
            current = digits[i];
            count = 1;
        } else count++;
    }
    return count === 2;
}

let count = 0;

for (let current = range.min; current < range.max; current = getNextAscendingNumber(current)) {
    if (getHasDoubleDigits(current)) count++;
}

console.log(count);
