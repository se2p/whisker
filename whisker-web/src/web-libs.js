/* jQuery */
const $ = require('jquery');
require('datatables.net')(window, $);

/* Bootstrap */
require('bootstrap/js/src/modal');

/* CodeMirror */
const CodeMirror = require('codemirror');
require('codemirror/mode/javascript/javascript');

/* FontAwesome */
require('@fortawesome/fontawesome-free/js/all');

/* FileSaver.js */
const FileSaver = require('file-saver');

/* Internationalization */
const i18next = require("i18next");
const jqueryI18next = require("jquery-i18next");

module.exports = {
    $,
    CodeMirror,
    FileSaver,
    i18next,
    jqueryI18next
};
