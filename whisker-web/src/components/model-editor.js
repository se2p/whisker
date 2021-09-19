const {ModelTester} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const {i18n} = require("../index");
const {CheckName} = require("whisker-main/src/whisker/model/components/Check");

class ModelEditor {

    // head line
    static ADD_TAB = '#model-editor-add-tab';
    static TABS = '#model-tabs';

    // configuration right pane, general settings
    static GENERAL_SETTINGS_DIV = '#model-general-settings';
    static ID_FIELD = "#editor-id";
    static LABEL_FIELD = '#editor-label';
    static OP_NAME_FIELD = '#model-editor-operation';
    static MODEL_ID_FIELD = '#model-id';
    static PROGRAM_TYPE_CHOICE = '#model-type-program';
    static USER_TYPE_CHOICE = '#model-type-user';
    static END_TYPE_CHOICE = '#model-type-end';
    static MODEL_DELETE_BUTTON = '#model-delete-button';

    // below the model editor
    static SAVE_BUTTON = '#model-editor-save';
    static APPLY_BUTTON = '#model-editor-apply';
    static ADD_NODE = '#model-add-node';
    static ADD_EDGE = '#model-add-edge';
    static CANCEL_ADD = '#model-cancel-add';
    static ADD_NODE_DIV = '#model-add-node-div';
    static ADD_EDGE_DIV = '#model-add-edge-div';
    static CANCEL_ADD_DIV = '.model-cancel-add-div';
    static EXPLANATION = '#model-explanation';
    static DELETE_DIV = '.model-delete-div';
    static DELETE_SELECTION = '#model-delete-selection';

    // todo condition, effect builder
    // configuration right pane, node settings
    static CONFIG_NODE = '#model-node-configuration';
    static CONFIG_NODE_LABEL = '#model-node-label';


    // configuration right pane, edge settings
    static CONFIG_EDGE = '#model-edge-configuration';
    static CONFIG_EDGE_LABEL = '#model-edge-label';

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

        this.options = {
            edges: {
                smooth: true,
                physics: true,
                arrows: {from: {enabled: false}, to: {enabled: true}}
            },
            interaction: {
                multiselect: true
            },
            physics: {
                stabilization: {
                    iterations: 1200
                },
            },
            manipulation: {
                enabled: false,
                addNode: this.addNode.bind(this),
                addEdge: this.addEdge.bind(this)
            },
            locale: $('#lang-select').val(),
            clickToUse: false,
            height: '420px',
            autoResize: false
        };
        this.data = {nodes: [{id: 'start', label: 'start', color: "rgb(0,151,163)"}], edges: []};
        this.network = new vis.Network($('#model-editor-canvas')[0], this.data, this.options);
        this.network.focus('start');
        this.setUpButtons();
        this.addTab(i18n.t('modelEditor:tabContent') + "1", 0);
        this.nextTabIndex = 2;
        this.changeToTab(0);
        this.drawModelEditor();
        this.setUpClickEvents();
    }

    // todo move tooltip on showing title higher

    onLoadEvent() {
        this.models = this.modelTester.getAllModels();
        this.createAllTabs();
        this.changeToTab(0);
        this.showGeneralSettings(0);
    }

// ###################### Graph manipulation ###########################

    addNode(data, callback) {
        this.models[this.currentTab].nodes.push({id: data.id, label: data.label});
        this.showAddButtons();
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
        this.models[this.currentTab].edges.push({
            id: data.id,
            label: data.label,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [],
            effects: []
        });
        this.showAddButtons();
        callback(data);
    }

    // Checks in Check.ts
    // [
    //     "AttrChange", // sprite name, attr name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    //     "AttrComp",// args: sprite name, attribute name, comparison (=,>,<...), value to compare to
    //     "BackgroundChange",
    //      "Click", // args: sprite name
    //     "Function",
    //     "Key", // args: key name
    //     "Output", // sprite name, string output
    //     "SpriteColor", // sprite touching a color, args: sprite name, red, green, blue values
    //     "SpriteTouching", // two sprites touching each other, args: two sprite names
    //     "VarChange", // sprite name, var name, ( + | - | = | += | -= | +<number> | <number> | -<number>)
    //     "VarComp",// args: sprite name, variable name, comparison (=,>,<...), value to compare to
    //     "Expr", // evaluate an expression, args: expression
    //     "Probability", // for randomness, e.g. take an edge with probability 0.5. arg: probability (checks
    //     // rand<=prob) (but this probability depends on the other edge conditions tested before -> edge conditions are
    //     // tested one for one and not tested if another edge is taken before it)
    //     "TimeElapsed", // time from the test start on, time in milliseconds
    //     "TimeBetween", //  time from the last edge transition in the model, in milliseconds
    //     "TimeAfterEnd", // time from program end (for after end models)
    //     "NbrOfClones", // sprite name, comparison, number
    //     "NbrOfVisibleClones", // sprite name, comparison, number
    //     "TouchingEdge", // sprite name regex
    //     "TouchingVerticalEdge", // sprite name regex
    //     "TouchingHorizEdge", // sprite name regex
    //     "RandomValue" // sprite name regex, attrName
    // ]

    editEdge(data, callback) {
        console.log("edit edge")
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

    /**
     * Delete the selected nodes and edges from the graph, only if the start node is not contained.
     * @return {boolean} Whether they were deleted.
     */
    deleteSelection() {
        let selection = this.network.getSelection();

        if (selection.nodes.indexOf(this.models[this.currentTab].startNodeId) !== -1) {
            return false;
        }
        this.models[this.currentTab].stopNodeIds =
            this.getNotRemovedOnesByString(this.models[this.currentTab].stopNodeIds, selection.nodes);
        this.models[this.currentTab].stopAllNodeIds =
            this.getNotRemovedOnesByString(this.models[this.currentTab].stopAllNodeIds, selection.nodes);
        this.models[this.currentTab].nodes =
            this.getNotRemovedOnesByID(this.models[this.currentTab].nodes, selection.nodes);
        this.models[this.currentTab].edges =
            this.getNotRemovedOnesByID(this.models[this.currentTab].edges, selection.edges);
        return true;
    }

    getNotRemovedOnesByString(original, toRemove) {
        let notRemoved = [];
        for (let i = 0; i < original.length; i++) {
            if (toRemove.indexOf(original[i]) === -1) {
                notRemoved.push(original[i]);
            }
        }
        return notRemoved;
    }

    getNotRemovedOnesByID(original, toRemove) {
        let notRemoved = [];
        for (let i = 0; i < original.length; i++) {
            if (toRemove.indexOf(original[i].id) === -1) {
                notRemoved.push(original[i]);
            }
        }
        return notRemoved;
    }

    // ############################# Plotting and GUI setup ############################

    drawModelEditor() {
        this.network.redraw();
        this.network.fit();
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
        $(ModelEditor.GENERAL_SETTINGS_DIV).removeClass("hide");
        $(ModelEditor.CONFIG_NODE).addClass("hide");
        $(ModelEditor.CONFIG_EDGE).addClass("hide");

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
        this.showAddButtons();
    }

    /**
     * Style the nodes of the graph.
     */
    setupNodes(json) {
        let nodes = json.nodes;
        for (const node in nodes) {
            if (nodes[node].id === json.startNodeId) {
                nodes[node].color = "rgb(0,151,163)";
                nodes[node].title = i18n.t('modelEditor:startNode');
            } else if (json.stopAllNodeIds.indexOf(nodes[node].id) !== -1) {
                nodes[node].color = "rgb(102,102,102)";
                nodes[node].font = {color: "rgb(230,230,230)"};
                nodes[node].title = i18n.t('modelEditor:stopAllNode');
            } else if (json.stopNodeIds.indexOf(nodes[node].id) !== -1) {
                nodes[node].color = "rgb(201,201,201)";
                nodes[node].title = i18n.t('modelEditor:stopNode');
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
            $(ModelEditor.MODEL_ID_FIELD).focus();
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

        // Graph manipulation
        $(ModelEditor.ADD_NODE).on('click', () => {
            $(ModelEditor.EXPLANATION).text(i18n.t('modelEditor:explanationNode'));
            this.hideAddButtons();
            this.network.addNodeMode()
        });
        $(ModelEditor.ADD_EDGE).on('click', () => {
            this.hideAddButtons();
            $(ModelEditor.EXPLANATION).text(i18n.t('modelEditor:explanationEdge'));
            this.network.addEdgeMode();
        });
        $(ModelEditor.CANCEL_ADD).on('click', () => {
            this.showAddButtons();
            this.network.disableEditMode();
        })
        $(ModelEditor.DELETE_SELECTION).on('click', () => {
            this.showConfirmPopup(i18n.t('modelEditor:deleteSelectionMsg'), () => {
                if (this.deleteSelection()) {
                    this.network.deleteSelected();
                    this.showAddButtons();
                } else {
                    this.showPopup(i18n.t('modelEditor:deletionError'));
                }
            })
        })
    }

    hideAddButtons() {
        $(ModelEditor.ADD_NODE_DIV).addClass("hide");
        $(ModelEditor.ADD_EDGE_DIV).addClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).removeClass("hide");
        $(ModelEditor.DELETE_DIV).addClass("hide");
    }

    showAddButtons() {
        $(ModelEditor.ADD_NODE_DIV).removeClass("hide");
        $(ModelEditor.ADD_EDGE_DIV).removeClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).addClass("hide");
        $(ModelEditor.DELETE_DIV).addClass("hide");
    }

    showDeleteButton() {
        $(ModelEditor.ADD_NODE_DIV).addClass("hide");
        $(ModelEditor.ADD_EDGE_DIV).addClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).addClass("hide");
        $(ModelEditor.DELETE_DIV).removeClass("hide");
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
        this.showConfirmPopup(i18n.t('modelEditor:deletePromptMessage'),
            () => {
                this.deleteCurrentModel();
                this.removeCurrentTab();
            })
    }

    /**
     * Remove the currently active tab and move to the previous one
     */
    removeCurrentTab() {
        $(ModelEditor.TABS).children('.active').remove();
        this.createAllTabs();
        // note: currentTab can also be "0" because of tabButton.value on change....
        this.changeToTab(this.currentTab == 0 ? 0 : this.currentTab - 1);
    }

    /**
     * Make an overlay over the model editor and show a confirm popup.
     * @param message Message of the popup
     */
    showPopup(message) {
        let dialog = $('<div/>', {class: 'popup'})
            .append(
                $('<p/>').html(message)
            )
            // CREATE THE BUTTONS
            .append(
                $('<div/>', {class: 'text-right'})
                    .append($('<button/>', {class: 'btn btn-main'}).html(i18n.t("modelEditor:okButton"))
                        .click(() => {
                            $('#model-editor-content').children('#model-popup').remove();
                        }))
            );

        // create overlay and popup over the model editor
        let overlay = $('<div/>', {class: 'overlay', id: 'model-popup'})
            .append(dialog);
        $('#model-editor-content').append(overlay);
    }

    /**
     * Make an overlay over the model editor and show a confirm popup.
     * @param message Message of the popup
     * @param callbackOnOk Callback function on ok button click.
     * @param callbackOnCancel Callback function on cancel button click
     */
    showConfirmPopup(message, callbackOnOk, callbackOnCancel) {
        let dialog = $('<div/>', {class: 'popup'})
            .append(
                $('<p/>').html(message)
            )
            // CREATE THE BUTTONS
            .append(
                $('<div/>', {class: 'text-right'})
                    .append($('<button/>', {class: 'btn btn-cancel'}).html(i18n.t("modelEditor:cancelButton"))
                        .click(() => {
                            if (callbackOnCancel) {
                                callbackOnCancel();
                            }
                            $('#model-editor-content').children('#model-confirm').remove()
                        })
                    )
                    .append($('<button/>', {class: 'btn btn-main'}).html(i18n.t("modelEditor:okButton"))
                        .click(() => {
                            if (callbackOnOk) {
                                callbackOnOk();
                            }
                            $('#model-editor-content').children('#model-confirm').remove();
                        }))
            );

        // create overlay and popup over the model editor
        let overlay = $('<div/>', {class: 'overlay', id: 'model-confirm'})
            .append(dialog);
        $('#model-editor-content').append(overlay);
    }

    /**
     * Setup the click events on nodes and edges.
     */
    setUpClickEvents() {
        // Control the buttons on select
        this.network.on('select', (data) => {
            if (data.edges.length + data.nodes.length === 0) {
                this.showGeneralSettings(this.currentTab);
                this.showAddButtons();
            } else {
                this.showDeleteButton();
                if (data.nodes.length === 1) {
                    this.showNodeOptions(data.nodes[0]);
                } else if (data.edges.length === 1 && data.nodes.length === 0) {
                    this.showEdgeOptions(data.edges[0]);
                }
            }
        })

    }

    showNodeOptions(nodeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass("hide");
        $(ModelEditor.CONFIG_NODE).removeClass("hide");
        $(ModelEditor.CONFIG_EDGE).addClass("hide");

        // get the corresponding node
        let node;
        for (let i = 0; i < this.models[this.currentTab].nodes.length; i++) {
            const n = this.models[this.currentTab].nodes[i];
            if (n.id === nodeID) {
                node = n;
                break;
            }
        }

        $(ModelEditor.CONFIG_NODE_LABEL).val(node.label);

    }

    showEdgeOptions(edgeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass("hide");
        $(ModelEditor.CONFIG_NODE).addClass("hide");
        $(ModelEditor.CONFIG_EDGE).removeClass("hide");

        // get the corresponding edge
        let edge;
        for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
            const e = this.models[this.currentTab].edges[i];
            if (e.id === edgeID) {
                edge = e;
                break;
            }
        }

        $(ModelEditor.CONFIG_EDGE_LABEL).val(edge.label);
    }

    /** for fixing model position after loading the element */
    reposition() {
        this.network.fit();
    }
}

module.exports = ModelEditor;
