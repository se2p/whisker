const {$} = require('../web-libs');

const standardConfig = require('../../../config/mio.json');

/**
 * <label></label>
 * <input type="file">
 */
class FileSelect {
    constructor (fileselect, onLoad) {
        this.fileselect = fileselect;
        this.files = [];

        $(fileselect).on('change', () => {
            this.files = [...this.fileselect.files];

            /* Reset the files so Chrome will load a new version of the same file if
             * a file, that was already selected, is selected again. */
            $(this.fileselect).val(null);

            /* Set the label. */
            const filenames = [];
            for (let i = 0; i < this.files.length; i++) {
                filenames[i] = this.files[i].name;
            }
            const label = filenames.join(', ');
            $(this.fileselect)
                .siblings('label')
                .html(label);

            onLoad(this);
        });
    }

    length () {
        return this.files.length;
    }

    hasName () {
        return this.files && this.files[0];
    }

    getName (index = 0) {
        return this.files[index].name;
    }

    async loadDefault() {
        return await new Promise((resolve, reject) => {
            let json = JSON.stringify(standardConfig);
            const blob = new Blob([json], {type:"application/json"});

            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = event => reject(event);
            reader.readAsArrayBuffer(blob);
        });
    }

    async loadAsArrayBuffer (index = 0) {
        return await new Promise((resolve, reject) => {
            const file = this.files[index];
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = event => reject(event);
            reader.readAsArrayBuffer(file);
        });
    }

    async loadAsString (index = 0) {
        let arrayBuffer;
        if (this.files[0] == null) {
            arrayBuffer = await this.loadDefault();
        } else {
            arrayBuffer = await this.loadAsArrayBuffer(index);
        }
        return new TextDecoder('utf-8').decode(new Uint8Array(arrayBuffer));
    }
}

module.exports = FileSelect;
