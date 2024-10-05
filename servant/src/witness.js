const {prepareTestFiles} = require("./common");
const {generateWitnessOnly} = require("./cli").opts;

module.exports = async function (pool) {
    if (generateWitnessOnly) {
        prepareTestFiles();
    } else {
        await require("./run")(pool);
    }
}
