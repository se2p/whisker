const {$} = require('../web-libs');

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

    getName (index = 0) {
        return this.files[index].name;
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
        const arrayBuffer = await this.loadAsArrayBuffer(index);
        return String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
    }
}

module.exports = FileSelect;
