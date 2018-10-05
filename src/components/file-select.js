const {$} = require('../web-libs');

/**
 * <label></label>
 * <input type="file">
 */
class FileSelect {
    constructor (fileselect, onLoad) {
        this.fileselect = $(fileselect)[0];

        $(fileselect).on('change', () => {
            const files = this.fileselect.files;
            if (files.length > 0) {
                const filenames = [];
                for (let i = 0; i < files.length; i++) {
                    filenames[i] = files[i].name;
                }
                const label = filenames.join(', ');
                $(this.fileselect)
                    .siblings('label')
                    .html(label);

                onLoad(this);
            }
        });
    }

    length () {
        return this.fileselect.files.length;
    }

    getName (index = 0) {
        return this.fileselect.files[index].name;
    }

    async loadAsArrayBuffer (index = 0) {
        return await new Promise((resolve, reject) => {
            const file = this.fileselect.files[index];
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
