const {prepareTestFiles} = require("./common");
const {generateWitnessOnly} = require("./cli").opts;

module.exports = async function (page) {
    if (generateWitnessOnly) {
        prepareTestFiles();
    } else {
        await require("./run")(page);
    }
}
