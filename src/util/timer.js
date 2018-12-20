const names = [
    'callbacks-before',
    'random-inputs',
    'inputs',
    'sprites',
    'scratch',
    'callbacks-after',
    'constraints'
];

let currentTimestamp;
let currentRecord;
let records;

const resetRecords = function () {
    records = [];
};

const startRecord = function () {
    currentTimestamp = window.performance.now();
    currentRecord = [];
};

const record = function () {
    currentRecord.push(window.performance.now() - currentTimestamp);
};

const endRecord = function () {
    records.push(currentRecord);
};

const getRecords = function () {
    return {
        names,
        records
    };
};

module.exports = {
    resetRecords,
    startRecord,
    record,
    endRecord,
    getRecords
};
