const chalk = require("chalk");

module.exports = {
    info: (...args) => console.info(chalk.white.bgGreen.bold(' INFO: '), ...args),
    error: (...args) => console.error(chalk.white.bgRed.bold('\n ERRORS: \n'), ...args, '\n'),
    warn: (...args) => console.warn(chalk.white.bgYellow.bold('\n WARNING: \n'), ...args, '\n'),
    log: (...args) => console.log(...args),
    debug: (...args) => console.debug(chalk.white.bgBlue.bold(' DEBUG: '), ...args, '\n'),
    clear: () => console.clear()
};
