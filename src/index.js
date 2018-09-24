/* Hackish page for testing, will be removed when the actual page is implemented. */

const Scratch = window.Scratch = window.Scratch || {};

const {$, CodeMirror} = require('./web-libs');

const Whisker = require('../../whisker/src/index');

const VirtualMachine = Whisker.VirtualMachine;
const ScratchStorage = Whisker.ScratchStorage;
const ScratchRender = Whisker.ScratchRender;
const ScratchSVGRenderer = Whisker.ScratchSVGRenderer;
const AudioEngine = Whisker.AudioEngine;


const ASSET_SERVER = 'https://cdn.assets.scratch.mit.edu/';
const PROJECT_SERVER = 'https://cdn.projects.scratch.mit.edu/';

let timeouts = [];
let steppingInterval = -1;
let testEditor;
let testTable;

const writeToOutput = function (text, clear) {
    const output = document.getElementById('output');
    output.style.display = 'block';
    if (clear) {
        output.innerHTML = text;
    } else {
        output.innerHTML = `${output.innerHTML}<br/>${text}`;
    }
};

const getProjectUrl = function (asset) {
    const assetIdParts = asset.assetId.split('.');
    const assetUrlParts = [PROJECT_SERVER, 'internalapi/project/', assetIdParts[0], '/get/'];
    if (assetIdParts[1]) {
        assetUrlParts.push(assetIdParts[1]);
    }
    return assetUrlParts.join('');
};

const getAssetUrl = function (asset) {
    const assetUrlParts = [
        ASSET_SERVER,
        'internalapi/asset/',
        asset.assetId,
        '.',
        asset.dataFormat,
        '/get/'
    ];
    return assetUrlParts.join('');
};

let step = function () {
    Scratch.vm.runtime._step();
};

const isRunning = function () {
    return steppingInterval !== -1;
};

const start = function () {
    if (!isRunning()) {
        const interval = 17;
        Scratch.vm.runtime.currentStepTime = interval;
        steppingInterval = setInterval(() => {
            step();
        }, interval);
    }
};

const pause = function () {
    if (isRunning()) {
        clearInterval(steppingInterval);
        steppingInterval = -1;
    }
};

const pauseResume = function () {
    if (isRunning()) {
        pause();
    } else {
        start();
    }
};

const greenFlag = function () {
    start();
    Scratch.vm.greenFlag();
};

const stop = function () {
    start();
    Scratch.vm.stopAll();

    for (let i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
    timeouts = [];

    $('#green-flag')
        .removeClass('btn-success')
        .addClass('btn-outline-success');
    $('#stop').prop('disabled', true);
};

const onMouseMove = function (e) {
    const canvas = document.getElementById('scratch-stage');
    const rect = canvas.getBoundingClientRect();
    const coordinates = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        canvasWidth: rect.width,
        canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', coordinates);
};

const onMouseDown = function (e) {
    const canvas = document.getElementById('scratch-stage');
    const rect = canvas.getBoundingClientRect();
    const data = {
        isDown: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        canvasWidth: rect.width,
        canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
};

const onMouseUp = function (e) {
    const canvas = document.getElementById('scratch-stage');
    const rect = canvas.getBoundingClientRect();
    const data = {
        isDown: false,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        canvasWidth: rect.width,
        canvasHeight: rect.height
    };
    Scratch.vm.postIOData('mouse', data);
    e.preventDefault();
};

const onKeyDown = function (e) {
    // Don't capture keys not intended for Scratch
    if (e.target.localName !== 'input' && e.target.localName !== 'textarea') {
        Scratch.vm.postIOData('keyboard', {
            keyCode: e.keyCode,
            key: e.key,
            isDown: true
        });
    }
};

const onKeyUp = function (e) {
    // Always capture up events, even those that have switched to other targets.
    Scratch.vm.postIOData('keyboard', {
        key: e.key,
        isDown: false
    });

    // e.g., prevent scroll.
    if (e.target !== document && e.target !== document.body) {
        e.preventDefault();
    }
};

const toggleInput = function () {
    const canvas = document.getElementById('scratch-stage');

    if ($('#enable-input').is(':checked')) {
        document.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    } else {
        document.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    }
};

const setup = function () {
    const vm = new VirtualMachine();
    Scratch.vm = vm;
    Scratch.vm.runtime.start = () => {};

    const storage = new ScratchStorage();
    const AssetType = storage.AssetType;
    storage.addWebStore([AssetType.Project], getProjectUrl, getProjectUrl, getProjectUrl);
    storage.addWebStore([AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound], getAssetUrl,
        getAssetUrl, getAssetUrl);
    vm.attachStorage(storage);

    const canvas = document.getElementById('scratch-stage');
    const renderer = new ScratchRender(canvas);
    Scratch.renderer = renderer;
    vm.attachRenderer(renderer);
    const audioEngine = new AudioEngine();
    vm.attachAudioEngine(audioEngine);
    vm.attachV2SVGAdapter(new ScratchSVGRenderer.SVGRenderer());
    vm.attachV2BitmapAdapter(new ScratchSVGRenderer.BitmapAdapter());

    start();

    Scratch.vm.addListener('PROJECT_RUN_START', () => {
        $('#green-flag')
            .removeClass('btn-outline-success')
            .addClass('btn-success');
        $('#stop').prop('disabled', false);
    });
    Scratch.vm.addListener('PROJECT_RUN_STOP', () => {
        $('#green-flag')
            .removeClass('btn-success')
            .addClass('btn-outline-success');
        $('#stop').prop('disabled', true);
    });

    toggleInput();
};

const loadProject = function (successCallback, errorCallback) {
    const fileSelect = document.getElementById('project-filechooser');
    const file = fileSelect.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        Scratch.vm.clear();
        Scratch.vm.loadProject(event.target.result).then(successCallback, errorCallback);
    };
    reader.readAsArrayBuffer(file);
    return -1;
};

const setTestTable = function (tests) {
    let index = 1;
    tests = tests.map(test => {
        if (typeof test === 'function') {
            return {
                test: test,
                name: test.name,
                description: 'N/A',
                categories: []
            };
        } else if (typeof test === 'object') {
            test.index = index++;
            if (typeof test.test === 'undefined') {
                return null;
            }
            if (typeof test.name === 'undefined') {
                test.name = test.test.name;
            }
            if (typeof test.description === 'undefined') {
                test.description = 'N/A';
            }
            if (typeof test.categories === 'undefined') {
                test.categories = [];
            }
            return test;
        }
        return null;
    });

    if (testTable) {
        testTable.destroy();
        $('#tests tbody').off('click', '.toggle-details');
    }

    testTable = $('#tests').DataTable({
        data: tests,
        paging: false,
        pageLength: 5,
        lengthChange: false,
        pagingType: 'simple',
        autoWidth: false,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row"<"col-sm-12 col-md-5"><"col-sm-12 col-md-7"p>>',
        columns: [
            {
                className: 'toggle-details',
                orderable: false,
                data: null,
                defaultContent: '<button class="btn btn-sm btn-xs btn-outline-secondary">' +
                    '<i class="toggle-details-icon fas fa-plus"></i></button>',
                width: '0.5em'
            },
            {
                data: 'index',
                className: 'text-center',
                width: '1.5em'
            },
            {
                data: 'name',
                width: '60%'
            },
            {
                data: data => data.categories.join(', '),
                width: '30%'
            },
            {
                orderable: false,
                data: null,
                defaultContent:
                    '<button class="btn btn-sm btn-xs btn-outline-secondary" onclick="Playground.test();">' +
                    '<i class="fas fa-play"></i></button>',
                width: '0.5em'
            }
        ],
        order: [],
        search: {
            smart: true
        },
        language: {
            emptyTable: 'No tests loaded'
        }
    });

    window.testTable = testTable;

    $('#tests tbody').on('click', '.toggle-details', function () {
        const tr = $(this).closest('tr');
        const row = testTable.row(tr);

        if (row.child.isShown()) {

            row.child.hide();
            tr.removeClass('shown');

            $(this).find('.toggle-details-icon')
                .removeClass('fa-minus')
                .addClass('fa-plus');

        } else {

            const data = row.data();
            let categories;

            if (data.categories.length === 0) {
                categories = 'N/A';
            } else {
                categories = data.categories.join(', ');
            }

            const info = '' +
                '<table class="child-table">' +
                    '<tbody>' +
                        '<tr>' +
                            '<td>Description:</td>' +
                            '<td>' + data.description + '</td>' +
                        '</tr>' +
                        '<tr>' +
                            '<td>Categories:</td>' +
                            '<td>' + categories + '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>';

            row.child(info).show();
            tr.addClass('shown');

            $(this).find('.toggle-details-icon')
                .removeClass('fa-plus')
                .addClass('fa-minus');
        }
    });
};

const setTestCode = function (code) {
    if (testEditor) {
        testEditor.setValue(code);
    } else {
        $('#test-code').html(code);
    }
};

const toggleEditor = function () {
    if ($('#show-editor').is(':checked')) {
        $('.CodeMirror').show();
        $('#apply-tests').show();

        if (!testEditor) {
            testEditor = CodeMirror.fromTextArea(document.getElementById('test-code'), {
                lineNumbers: true,
                indentUnit: 4,
                smartIndent: true,
                indentWithTabs: false,
                matchBrackets: true,
                mode: 'text/javascript',
                autoCloseBrackets: true,
                styleActiveLine: true,
                extraKeys: {'Ctrl-Space': 'autocomplete'},
                keyMap: 'default'
            });
            testEditor.setSize(null, 500);
        }
    } else {
        $('.CodeMirror').hide();
        $('#apply-tests').hide();
    }
};

const loadTests = function () {
    const fileSelect = document.getElementById('test-filechooser');
    const file = fileSelect.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
        const str = String.fromCharCode.apply(null, new Uint8Array(event.target.result));
        const tests = Whisker.loadFromString(str);
        setTestCode(str);
        setTestTable(tests);
    };
    reader.readAsArrayBuffer(file);
    return -1;
};

const applyTests = function () {
    const str = testEditor.getValue();
    const tests = Whisker.loadFromString(str);
    setTestTable(tests);
};

const test = function () {
    loadProject(() => {
        writeToOutput('Running Test', true);

        const sprite = Scratch.vm.runtime.targets[1];

        const startX = sprite.x;
        const startY = sprite.y;
        let oldX = startX;

        let failures = false;

        const stepBackup = step;
        step = function () {
            if (!(startY === sprite.y)) {
                failures = true;
                writeToOutput('<font color="red">Constraint Failed:</font> "Sprite must not move vertically"');
                step = stepBackup;
            }
            if (!(sprite.x >= oldX)) {
                failures = true;
                writeToOutput('<font color="red">Constraint Failed:</font> "Sprite must not move left"');
                step = stepBackup;
            }
            oldX = sprite.x;
            stepBackup();
        };

        console.log('stop');
        stop();
        console.log('green flag');
        greenFlag();

        timeouts.push(setTimeout(() => {
            pause();
            if (startX === sprite.x) {
                Scratch.vm.postIOData('keyboard', {
                    key: 'ArrowRight',
                    isDown: true
                });
                start();
                timeouts.push(setTimeout(() => {
                    Scratch.vm.postIOData('keyboard', {
                        key: 'ArrowRight',
                        isDown: false
                    });
                }, 250));
                timeouts.push(setTimeout(() => {
                    pause();
                    if (sprite.x > startX) {
                        writeToOutput(failures ? 'Test finished with failures' : 'Test finished without failures');
                        step = stepBackup;
                        stop();
                    } else {
                        writeToOutput('<font color="red">Assertion Failed:</font> ' +
                            '"Sprite must move right when right arrow key is pressed"');
                        writeToOutput('Test finished with failures');
                        step = stepBackup;
                        stop();
                    }
                }, 500));
            } else {
                writeToOutput('<font color="red">Assertion Failed:</font> ' +
                    '"Sprite must not move right when no key is pressed"');
                writeToOutput('Test finished with failures');
                step = stepBackup;
                stop();
            }
        }, 500));
    }, () => {
        writeToOutput('Loading Project Failed', true);
    });
};

window.Playground = {
    loadTests: loadTests,
    applyTests: applyTests,
    loadProject: loadProject,
    greenFlag: greenFlag,
    stop: stop,
    isRunning: isRunning,
    pause: pause,
    start: start,
    pauseResume: pauseResume,
    test: test,
    toggleEditor: toggleEditor,
    toggleInput: toggleInput
};

window.onload = function () {
    setup();
};

window.onhashchange = function () {
    location.reload();
};

$(document).ready(() => {
    setTestTable([]);
    setTestCode(
`const test = function (whisker) {
    /* your code here */
    whisker.end();
}

const tests = [
    {
        test: test,
        name: 'Example Test',
        description: '',
        categories: []
    }
];
tests;`
    );

    $('#project-filechooser').change(function () {
        $('#project-filechooser-label')
            .html($(this)
                .val()
                .split('\\')
                .pop());
    });

    $('#test-filechooser').change(function () {
        $('#test-filechooser-label')
            .html($(this)
                .val()
                .split('\\')
                .pop());
    });
});
