/* jQuery */
const $ = require('jquery');
require('datatables.net')(window, $);

/* Bootstrap */
window.Popper = require('popper.js/dist/umd/popper.js').default;
require('bootstrap/js/src/modal');
require('bootstrap/js/src/tooltip');
require('bootstrap-slider/src/js/bootstrap-slider');

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
