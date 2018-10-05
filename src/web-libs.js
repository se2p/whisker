/* jQuery */
const $ = require('jquery');
require('datatables.net')(window, $);

/* Bootstrap */
// require('bootstrap/js/src/button');

/* CodeMirror */
const CodeMirror = require('codemirror');
require('codemirror/mode/javascript/javascript');

/* FontAwesome */
require('@fortawesome/fontawesome-free/js/all');

/* FileSaver.js */
const FileSaver = require('file-saver');

module.exports = {
    $,
    CodeMirror,
    FileSaver
};
