const {$, CodeMirror, FileSaver} = require('../web-libs');

/**
 * <div>
 *     <button class="editor-apply"></button>
 *     <button class="editor-save"></button>
 * </div>
 */
class TestEditor {
    constructor (div, loadTests) {
        this.div = div;

        this.codemirror = CodeMirror(cm => $(div).prepend(cm), {
            lineNumbers: true,
            indentUnit: 4,
            smartIndent: true,
            indentWithTabs: false,
            mode: 'application/javascript',
            extraKeys: {Tab: 'insertSoftTab'}
        });

        $('.editor-apply')
            .on('click', () => {
                $('.editor-apply').tooltip('hide');
                loadTests(this.getValue());
            });

        $('.editor-save')
            .on('click', () => {
                $('.editor-save').tooltip('hide');
                this.save();
            });
    }

    getValue () {
        return this.codemirror.getValue();
    }

    setValue (value) {
        this.codemirror.setValue(value);
    }

    setDefaultValue () {
        this.setValue('' +
`const test = async function (t) {
    /* your code here */
    let sprite = t.getSprite('SpriteName');
    await t.runForTime(5000);
    t.end();
}

module.exports = [
    {
        test: test,
        name: 'Example Test',
        description: '',
        categories: []
    }
];`
        );
    }

    show () {
        $(this.div).show();
        this.codemirror.refresh();
    }

    hide () {
        $(this.div).hide();
    }

    save () {
        const blob = new Blob([this.getValue()], {type: 'application/javascript;charset=utf-8'});
        FileSaver.saveAs(blob, 'tests.js');
    }
}

module.exports = TestEditor;
