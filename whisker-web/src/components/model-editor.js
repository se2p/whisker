const {ModelTester} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const {i18n} = require("../index");

class ModelEditor {

    // head line
    static ADD_TAB = '#model-editor-add-tab';
    static TABS = '#model-tabs';

    // configuration right pane
    static ID_FIELD = "#editor-id";
    static LABEL_FIELD = '#editor-label';
    static OP_NAME_FIELD = '#model-editor-operation';
    static MODEL_ID_FIELD = '#model-id';
    static PROGRAM_TYPE_CHOICE = '#model-type-program';
    static USER_TYPE_CHOICE = '#model-type-user';
    static END_TYPE_CHOICE = '#model-type-end';

    // below the model editor
    static SAVE_BUTTON = '#model-editor-save';
    static APPLY_BUTTON = '#model-editor-apply';
    static MODEL_DELETE_BUTTON = '#model-delete-button';

    /**
     * @param {ModelTester} modelTester
     */
    constructor(modelTester) {
        this.modelTester = modelTester;
        this.modelTester.on(ModelTester.ModelTester.MODEL_ON_LOAD, this.onLoadEvent.bind(this));

        // setup default model
        this.currentTab = 0;
        this.models = [];
        this.insertNewGraph();
        // const addNode = this.addNode;
        // const editNode = this.editNode;
        // const addEdge = this.addEdge;

        this.options = {
            edges: {
                smooth: true,
                physics: true,
                arrows: {from: {enabled: false}, to: {enabled: true}}
            },
            physics: {
                stabilization: {
                    iterations: 1200
                },
            },
            manipulation: {
                enabled: true,
                addNode: this.addNode.bind(this),
                editNode: this.editNode.bind(this),
                addEdge: this.addEdge.bind(this)
                // todo edit edge?
            },
            locale: $('#lang-select').val(),
            clickToUse: false,
            height: '420px',
            autoResize: false
        };
        this.data = {nodes: [{id: 'start', label: 'start', color: "rgb(0,151,163)"}], edges: []};
        this.network = new vis.Network($('#model-editor-canvas')[0], this.data, this.options);
        this.network.focus('start');
        document.getElementsByClassName('vis-network')[0].style['overflow'] = 'visible';
        // this.network.enableEditMode();
        this.setUpButtons();
        this.addTab(i18n.t('modelEditor:tabContent') + "1", 0);
        this.nextTabIndex = 2;
        this.changeToTab(0);
        this.drawModelEditor();


// todo
        this.network.on('selectNode', this.network.editNode); // todo needed?
        this.network.on('deselectNode', () => {
            $('#model-editor-operation').text(i18n.t(""));
            $('#editor-id').val("");
            $('#editor-label').val("");
        });
    }

    onLoadEvent() {
        this.models = this.modelTester.getAllModels();
        this.createAllTabs();
        this.changeToTab(0);
        this.showGeneralSettings(0);
    }

// ###################### Graph manipulation ###########################

    addNode(data, callback) {
        this.models[this.currentTab].nodes.push({id: data.id, label: data.label});
        callback(data);
    }

    editNode(data, callback) {
        console.log(data);
        // $(ModelEditor.OP_NAME_FIELD).text(i18n.t("model-editor:editNode"));
        // $(ModelEditor.ID_FIELD).val(data.x);
        // $(ModelEditor.LABEL_FIELD).val(data.label);

        callback(data);
    }

    addEdge(data, callback) {
        console.log(data);

        let newEdge = {
            id: data.id,
            label: data.label,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [],
            effects: []
        };

        this.models[this.currentTab].edges.push(newEdge);
        callback(data);
    }

    editEdge(data, callback) {
        //     if (typeof data.to === "object") data.to = data.to.id;
        //     if (typeof data.from === "object") data.from = data.from.id;
    }

    insertNewGraph() {
        let id = i18n.t("modelEditor:tabContent") + (this.models.length + 1);
        this.models.push({
            id: id,
            usage: 'program',
            startNodeId: 'start',
            nodes: [{id: 0, label: 'start'}],
            stopNodeIds: [],
            stopAllNodeIds: [],
            edges: []
        })
    }

    deleteCurrentModel() {
        this.models.splice(this.currentTab, 1);
    }

    // ############################# Plotting and GUI setup ############################

    drawModelEditor() {
        this.network.redraw();
        this.network.fit();

        // set css attributes here as css file is ignored by framework redraw
        document.getElementsByClassName('vis-network')[0].style['overflow'] = 'visible';
        // todo fix delete button
        // document.getElementsByClassName('vis-close')[0].val("Löschen");
    }

    loadModel(tabNbr = 0) {
        if (tabNbr < 0 || tabNbr >= this.models.length) {
            throw Error("Tab number negative or higher than number of models.");
        }

        this.currentTab = tabNbr;

        if (this.models.length === 0) {
            this.nodes = [];
            this.edges = [];
        } else {
            this.nodes = this.setupNodes(this.models[tabNbr]);
            this.edges = this.setupEdges(this.models[tabNbr].edges, this.nodes);
        }

        this.data = {nodes: this.nodes, edges: this.edges};
        this.network.setData(this.data);
        this.drawModelEditor();
    }

    /**
     * Show the general settings for a model, id, usage etc.
     */
    showGeneralSettings(tabNbr) {
        document.getElementById('model-general-settings').style.display = 'block';
        document.getElementById('model-editor-configuration').style.display = 'none';
        // load into the header etc
        $(ModelEditor.MODEL_ID_FIELD).val(this.models[tabNbr].id);

        if (this.models[tabNbr].usage === "program" || this.models[tabNbr].usage === undefined) {
            $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', true);
            $(ModelEditor.USER_TYPE_CHOICE).prop('checked', false);
            $(ModelEditor.END_TYPE_CHOICE).prop('checked', false);
        } else if (this.models[tabNbr].usage === "user") {
            $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', false);
            $(ModelEditor.USER_TYPE_CHOICE).prop('checked', true);
            $(ModelEditor.END_TYPE_CHOICE).prop('checked', false);
        } else {
            $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', false);
            $(ModelEditor.USER_TYPE_CHOICE).prop('checked', false);
            $(ModelEditor.END_TYPE_CHOICE).prop('checked', true);
        }

        if (this.models.length === 1) {
            $(ModelEditor.MODEL_DELETE_BUTTON).addClass('hide');
        } else {
            $(ModelEditor.MODEL_DELETE_BUTTON).removeClass('hide');
        }
    }

    hideGeneralSettings() {
        document.getElementById('model-general-settings').style.display = 'none';
        document.getElementById('model-editor-configuration').style.display = 'block';
    }

    /**
     * Style the nodes of the graph.
     */
    setupNodes(json) {
        let nodes = json.nodes;
        for (const node in nodes) {
            if (nodes[node].id === json.startNodeId) {
                nodes[node].color = "rgb(0,151,163)";
                nodes[node].title = "Start";
            }
        }
        return nodes;
    }

    /**
     * Style the edges and move loops to different angles.. Could be solves better if the
     */
    setupEdges(json, nodes) {
        let edges = json;
        let loops = [];
        nodes.forEach(node => {
            loops[node.id] = [];
        })

        for (const edgeId in edges) {
            if (edges[edgeId].from === edges[edgeId].to) {
                loops[edges[edgeId].from].push(edges[edgeId]);
            }
        }
        for (const nodeId in loops) {
            if (loops[nodeId].length > 1) {
                let i = 0;
                loops[nodeId].forEach(edge => {
                    edge.selfReference = {angle: i + i * loops[nodeId].length};
                    edge.font = {align: "horizontal"};
                    if (i % 2 === 0) {
                        edge.font.vadjust = -20 - loops[nodeId].length;
                    } else {
                        edge.font.vadjust = 20 + loops[nodeId].length;
                    }
                    i++;
                })
                nodes.forEach(node => {
                    if (node.id === nodeId) {
                        node.widthConstraint = 100
                    }
                })
            }
        }

        return edges;
    }

    /**
     * Set up gui buttons such as save, apply, add tab etc.
     */
    setUpButtons() {
        // apply and download below model editor
        $(ModelEditor.APPLY_BUTTON).on('click', this.applyButton.bind(this));
        $(ModelEditor.SAVE_BUTTON).on('click', this.downloadButton.bind(this));

        // tab behaviour
        $(ModelEditor.ADD_TAB).on('click', () => {
            this.insertNewGraph();
            this.addTab(i18n.t("modelEditor:tabContent") + this.nextTabIndex, this.models.length - 1);
            this.nextTabIndex++;
            this.changeToTab(this.models.length - 1);
        })

        // General settings of model
        $(ModelEditor.MODEL_ID_FIELD).on('keyup change', this.onModelIDChange.bind(this));
        $(ModelEditor.PROGRAM_TYPE_CHOICE).on('click', () => {
            this.models[this.currentTab].usage = "program";
        })
        $(ModelEditor.USER_TYPE_CHOICE).on('click', () => {
            this.models[this.currentTab].usage = "user";
        })
        $(ModelEditor.END_TYPE_CHOICE).on('click', () => {
            this.models[this.currentTab].usage = "end";
        })
        $(ModelEditor.MODEL_DELETE_BUTTON).on('click', this.onDeleteModelButton.bind(this));
    }

    /**
     * Change the view to a model based on a clicked tab.
     * @param tabNr Number of the tab
     */
    changeToTab(tabNr) {
        this.loadModel(tabNr);

        let children = $(ModelEditor.TABS).children();
        let oldAttr = children[tabNr].getAttribute('class')
        let isActive = oldAttr.indexOf("active");
        if (isActive !== -1) {
            oldAttr = oldAttr.substring(0, isActive) + oldAttr.substring(isActive + 6, oldAttr.length);
        }
        for (let i = 0; i < children.length; i++) {
            children[i].setAttribute('class', oldAttr);
        }
        children[tabNr].setAttribute('class', oldAttr + ' active');
        $(ModelEditor.TABS).scrollTop(children[tabNr].offsetTop);
        this.showGeneralSettings(tabNr);
    }

    /**
     * Create tabs based on the models loaded.
     */
    createAllTabs() {
        // clear tabs
        $(ModelEditor.TABS).children().remove();

        if (!this.models.length || this.models.length === 0) {
            return;
        }

        for (let i = 0; i < this.models.length; i++) {
            this.addTab(this.models[i].id, i);
        }
    }

    /**
     * Add a new tab to the editor with the model having the given name.
     */
    addTab(name, nbr) {
        let button = document.createElement("button");
        button.type = "button";
        button.setAttribute('class', 'tab-model-editor-button');
        button.textContent = name;
        button.setAttribute('value', nbr);

        button.onclick = () => {
            this.changeToTab(button.value);
        }
        $(ModelEditor.TABS).append(button);
    }

    /**
     * Load the models from the editor into the modelTester and change to the last active tab (as the order of
     * models can switch based on model type).
     */
    applyButton() {
        // get current active tab
        let lastFocus = $(ModelEditor.TABS).children('.active')[0].textContent;

        // load the models into the modelTester
        let json = JSON.stringify(this.models, null, 4);
        this.modelTester.load(json);
        $('#model-label').html('Loaded from model editor');

        // change to last active tab
        let lastIndex = 0;
        let newChildren = $(ModelEditor.TABS).children();
        for (let i = 0; i < newChildren.length; i++) {
            if (newChildren[i].textContent === lastFocus) {
                lastIndex = newChildren[i].value;
                break;
            }
        }

        this.changeToTab(lastIndex);
    }

    /** Download the models in the editor. */
    downloadButton() {
        let json = JSON.stringify(this.modelTester.getAllModels(), null, 4);
        const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'models.json');
    }

    /**
     * When the id input field sends a keyup change event, check for duplicate model ids (if true add a number to
     * the id) and update the model.
     */
    onModelIDChange() {
        let newValue = $(ModelEditor.MODEL_ID_FIELD).val();

        // ignore all not changing buttons such as SHIFT
        if (newValue === $(ModelEditor.TABS).children('.active')[0].textContent) {
            return;
        }

        let hasThisId = 0;
        for (let i = 0; i < this.models.length; i++) {
            if (this.models[i].id === newValue) {
                hasThisId++;
            }
        }

        if (hasThisId > 0) {
            this.models[this.currentTab].id = newValue + hasThisId;
            setTimeout(() => {
                $(ModelEditor.MODEL_ID_FIELD).val(this.models[this.currentTab].id);
            }, 1000)
        } else {
            this.models[this.currentTab].id = newValue;
        }
        $(ModelEditor.TABS).children('.active')[0].textContent = this.models[this.currentTab].id;
    }

    /**
     * When the delete model button is clicked show a popup to confirm.
     */
    onDeleteModelButton() {
        this.showPopUp(i18n.t('modelEditor:deletePromptMessage'),
            () => {
                this.deleteCurrentModel();
                this.removeCurrentTab();
                $('#model-editor-content').children('.overlay').remove()
            }, () => {
                $('#model-editor-content').children('.overlay').remove()
            })
    }

    /**
     * Remove the currently active tab and move to the previous one
     */
    removeCurrentTab() {
        $(ModelEditor.TABS).children('.active').remove();
        this.createAllTabs();
        this.changeToTab(this.currentTab == 0 ? 0 : this.currentTab - 1);
    }

    /**
     * Make an overlay over the model editor and show a popup.
     * @param message Message of the popup
     * @param callbackOnOk Callback function on ok button click.
     * @param callbackOnCancel Callback function on cancel button click
     */
    showPopUp(message, callbackOnOk, callbackOnCancel) {
        let dialog = $('<div/>', {class: 'popup'})
            .append(
                $('<p/>').html(message)
            )
            // CREATE THE BUTTONS
            .append(
                $('<div/>', {class: 'text-right'})
                    .append($('<button/>', {class: 'btn btn-cancel'}).html(i18n.t("modelEditor:cancelButton"))
                        .click(callbackOnCancel)
                    )
                    .append($('<button/>', {class: 'btn btn-main'}).html(i18n.t("modelEditor:okButton"))
                        .click(callbackOnOk))
            );

        // create overlay and popup over the model editor
        let overlay = $('<div/>', {class: 'overlay'})
            .append(dialog);
        $('#model-editor-content').append(overlay);
    }

    /** for fixing model position after loading the element */
    reposition() {
        this.network.fit();
    }
}

module.exports = ModelEditor;
