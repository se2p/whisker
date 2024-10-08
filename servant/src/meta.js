const {relativeToServantDir} = require("./util");

const {
    name,
    version,
    description,
} = require(relativeToServantDir("../package.json"))

module.exports = {
    name,
    version,
    description,
}
