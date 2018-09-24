/* jQuery */
const $ = require('jquery');
require('datatables.net')(window, $);

/* Bootstrap Tabs */
require('bootstrap/js/dist/tab');

/* CodeMirror */
const CodeMirror = require('codemirror');
require('codemirror/mode/javascript/javascript');

/* FontAwesome */
require('@fortawesome/fontawesome-free/js/all');

module.exports = {
    $: $,
    CodeMirror: CodeMirror
};
