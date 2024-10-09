const {prepareTestFiles} = require("./witness-util");
const {relativeToServantDir} = require("./util");
const {generateWitnessOnly} = require("./cli").opts;

module.exports = async function (pool) {
    if (generateWitnessOnly) {
        prepareTestFiles(relativeToServantDir(".."));
    } else {
        await require("./run")(pool);
    }
}
