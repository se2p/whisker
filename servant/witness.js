const {prepareTestFiles} = require("./common");
const {generateWitnessOnly} = require("./cli").opts;

module.exports = async function (openNewPage) {
    if (generateWitnessOnly) {
        prepareTestFiles();
    } else {
        await require("./run")(openNewPage);
    }
}
