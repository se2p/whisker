const {$, CodeMirror, FileSaver} = require('../web-libs');
const JSZip = require('jszip');
const {saveAs} = require('file-saver');

/**
 * <div>
 *     <button class="editor-apply"></button>
 *     <button class="editor-save"></button>
 * </div>
 */
class TestEditor {
    constructor(div, loadTests) {
        this.div = div;

        this.agentTests = null;
        this.projectName = null;

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
                loadTests(this.getValue());
            });

        $('.editor-save')
            .on('click', () => {
                this.save();
            });
    }

    getValue() {
        return this.codemirror.getValue();
    }

    setValue(value) {
        this.codemirror.setValue(value);
    }

    setAgentTests(agentTests) {
        this.agentTests = agentTests;
    }

    setProjectName(projectName) {
        this.projectName = projectName;
    }

    setDefaultValue() {
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

    show() {
        $(this.div).show();
        this.codemirror.refresh();
    }

    hide() {
        $(this.div).hide();
    }

    async save() {
        if (this.agentTests !== null) {
            console.log('Downloading RL models as zip file...');
            await this.downloadModelsAsZip(this.agentTests, this.projectName);
        } else if ((this.getValue().includes('"Static":') && this.getValue().includes('"Dynamic":')) ||
            (this.getValue().includes('Network') && this.getValue().includes('Nodes'))) {
            const parsed = JSON.parse(this.getValue());
            const staticBlob = new Blob([parsed.Static], {type: 'application/javascript;charset=utf-8'});
            FileSaver.saveAs(staticBlob, 'static.js');
            const dynamicBlob = new Blob([JSON.stringify(parsed.Dynamic)], {type: 'application/json;charset=utf-8'});
            FileSaver.saveAs(dynamicBlob, 'dynamic.json');
        } else {
            const blob = new Blob([this.getValue()], {type: 'application/javascript;charset=utf-8'});
            FileSaver.saveAs(blob, 'tests.js');
        }
    }

    async downloadModelsAsZip(agentTests, projectName) {
        const zip = new JSZip();

        try {
            const savePromises = agentTests.map(async (agent, index) => {
                const modelFiles = await agent.saveModelToMemory(`Model-${index}`);

                modelFiles.forEach(file => {
                    zip.file(file.name, file.data);
                });
            });

            // Wait for all models to be saved
            await Promise.all(savePromises);

            // Generate the zip file with compression
            const zipContent = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                }
            });

            saveAs(zipContent, `${projectName.split('.sb3')[0]}.zip`);
        } catch (error) {
            console.error('Error during model export:', error);
            throw error;
        }
    }
}


module.exports = TestEditor;
