const {$, FileSaver} = require('../web-libs');

/**
 * <div>
 *     <pre class="output-content"></pre>
 *     <button class="output-save">
 *     <button class="output-clear">
 * </div>
 */
class Output {
    constructor (div) {
        this.div = $(div)[0];
        this.output = $(div).find('.output-content');

        $(div)
            .find('.output-save')
            .on('click', () => {
                this.save();
            });

        $(div)
            .find('.output-clear')
            .on('click', () => {
                this.clear();
            });

        this.setText('');
    }

    getText () {
        return this.text;
    }

    setText (text) {
        this.text = text;
        $(this.output).text(text);
    }

    print (text) {
        text = this.text + text;
        this.setText(text);
    }

    println (text = '') {
        this.print(`${text}\n`);
    }

    clear () {
        this.setText('');
    }

    show () {
        $(this.div).show();
    }

    hide () {
        $(this.div).hide();
    }

    save () {
        const blob = new Blob([this.getText()], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'output.txt');
    }
}

module.exports = Output;
