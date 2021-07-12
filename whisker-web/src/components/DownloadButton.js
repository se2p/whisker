const {$, FileSaver} = require('../web-libs');

class DownloadButton {
    constructor (div) {
        this.div = div;
        this.data = $(div).find('.button-data');


        $(div)
            .on('click', () => {
                this.save();
            });

        this.setData('');
    }

    setTitle (title){
        this.title = title;
    }

    setFormat (format){
        this.format = format;
    }

    setData (data) {
        this.data = data;
    }

    getData (){
        return this.data;
    }

    show () {
        $(this.div).show();
    }

    hide () {
        $(this.div).hide();
    }

    save () {
        const blob = new Blob([this.getData()], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, `${this.title}.${this.format}`);
    }
}

module.exports = DownloadButton;
