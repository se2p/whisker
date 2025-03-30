/**
 * The pattern that identifies the frame of a Whisker test execution in the stack trace of a Whisker test suite run.
 */
const pattern = /^\s*at(?: async)? .* \(eval at loadTestsFromString \(.*whisker-gui\.js:[1-9][0-9]*:[1-9][0-9]*\), <anonymous>:([1-9][0-9]*):[1-9][0-9]*\)/;

/**
 * Assuming the given stack trace was produced by a Whisker test, returns the line number in the Whisker test file the
 * stack trace originated from.
 *
 * @param stack {string} the stack trace
 * @return {number} the line number
 */
const getLineNumber = (stack) => {
    const frames = stack.split('\n');

    for (const frame of frames) {
        const match = frame.match(pattern);
        if (match) {
            const line = match[1];
            return Number(line);
        }
    }

    throw new Error(`Unable to extract line number from stack trace:\n${stack}`);
};

module.exports = {
    getLineNumber,
};
