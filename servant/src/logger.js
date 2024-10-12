const {verbose} = require("./cli").opts;
const Minilog = require('minilog');

/*
 * Verbosity levels:
 * 0: Do not print debug messages
 * 1: Print debug messages
 * 2: Additionally print timestamps
 */

const filter = verbose === 0 ? Minilog.suggest.deny(/.*/, "debug") : Minilog.suggest;
const printTimeStamps = Minilog.backends.nodeConsole.formatTime;
const formatter = verbose === 2 ? printTimeStamps : Minilog.defaultFormatter;

Minilog
    .pipe(filter)
    .pipe(formatter)
    .pipe(Minilog.defaultBackend);

module.exports = Minilog('servant');
