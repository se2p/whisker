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
        this.div = div;
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

    setTitle (title){
        this.title = title;
    }

    setScratch (scratch){
        this.scratch = scratch;
    }

    setMutants (mutants){
        this.mutants = mutants;
    }

    async save () {
        if (this.getText().length > 1) {
            if (this.getText().includes('Networks') && this.getText().includes('Nodes')) {
                const blob = new Blob([this.getText()], {type: 'application/json;charset=utf-8'});
                if (this.title) {
                    FileSaver.saveAs(blob, `${this.title}.json`);
                } else {
                    FileSaver.saveAs(blob, `populationRecord.json`);
                }
            } else if (this.mutants && this.mutants.length > 0) {
                for (const mutant of this.mutants) {
                    await this.scratch.vm.loadProject(JSON.parse(JSON.stringify(mutant)));
                    const projectBlob = await this.scratch.vm.saveProjectSb3();
                    FileSaver.saveAs(projectBlob, `${mutant.name}.sb3`);
                }
            } else {
                const blob = new Blob([this.getText()], {type: 'text/plain;charset=utf-8'});
                FileSaver.saveAs(blob, 'output.txt');
            }
        }
    }
}

module.exports = Output;
