function calAvg(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum / arr.length;
}

const arr = [10, 20, 30, 40, 50];
const average = calAvg(arr);
console.log("Average:", average);