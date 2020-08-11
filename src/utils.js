const showModal = function (title, content) {
    const $ = window.$;
    const modal = $(
        `<div class="modal" role="dialog">
            <div class="modal-dialog role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        </div>`
    );
    modal.appendTo(document.body);
    modal.modal('show');
}

/* https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript */
const escapeHtml = function (html) {
    var text = document.createTextNode(html);
    var p = document.createElement('p');
    p.appendChild(text);
    return p.innerHTML;
}

module.exports = {
    showModal,
    escapeHtml
};
