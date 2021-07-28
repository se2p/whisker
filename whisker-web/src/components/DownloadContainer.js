const {FileSaver} = require('../web-libs');

class DownloadContainer {
    constructor (title, format, data) {
        this.title = title;
        this.format = format;
        this.data = data;
    }

    // TODO: Doesn't work in headLess (-d) mode
    download () {
        const blob = new Blob([this.data], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, `${this.title}.${this.format}`);
    }
}

module.exports = DownloadContainer;
