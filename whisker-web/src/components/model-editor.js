const {ModelTester} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const cloneDeep = require('lodash.clonedeep')
const {i18n} = require("../index");
const {argType, checkLabelCodes, keys, placeholders, inputLabelCodes} = require("./model-editor-labelCodes");

/**
 * Model editor for building and editing models for testing in Scratch.
 *
 * Note: only problem with the framework are the built-in buttons to edit (that are not correctly displayed).
 * Replaced them with custom buttons, however as they can not triggering the edit mode of the framework, after
 * editing something on the graph the layout is reset. The built-in buttons are removed by
 * this.options.manipulation.enabled = false. If setting this to true, a div with class vis-manipulation and
 * vis-edit-mode are appended to the canvas but positioning and styling of the buttons was reset by any action, so
 * they were not correctly displayed.
 */
class ModelEditor {

    // head line
    static ADD_TAB = '#model-editor-add-tab';
    static TABS = '#model-tabs';

    // configuration right pane, general settings
    static GENERAL_SETTINGS_DIV = '#model-general-settings';
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
    static STANDARD_DIV = '.model-standard-div';
    static CANCEL_ADD_DIV = '.model-cancel-add-div';
    static EXPLANATION = '#model-explanation';
    static DELETE_DIV = '.model-delete-div';
    static DELETE_SELECTION = '#model-delete-selection';
    static LAYOUT = '#model-layout';
    static FIT = '#model-fit';

    // configuration right pane, node settings
    static CONFIG_NODE = '#model-node-configuration';
    static CONFIG_NODE_LABEL = '#model-node-label';
    static CONFIG_NODE_STOP1 = '#model-stopNode';
    static CONFIG_NODE_STOP2 = '#model-stopAllNode';
    static PRIORITY_CHANGER = '#model-priority-changer'
    static PRIORITY_CHANGER_DIV = '.model-priority-div'

    // configuration right pane, edge settings
    static CONFIG_EDGE = '#model-edge-configuration';
    static CONFIG_EDGE_LABEL = '#model-edge-label';
    static CONDITIONS = '#model-conditions';
    static EFFECTS = '#model-effects';
    static ADD_CONDITION = '#model-editor-addC';
    static ADD_EFFECT = '#model-editor-addE';
    static FORCE_TEST_AT = '#model-forceTestAt';
    static FORCE_TEST_AFTER = '#model-forceTestAfter';

    // checks
    static CHECK_DIV = '#model-edge-check-div';
    static CHECK_CHOOSER = '#model-edge-check';
    static CHECK_BACK = '#model-check-back';
    static CHECK_SAVE = '#model-check-save';
    static CHECK_LABEL = '#model-check-label';
    static CHECK_NEGATED = '#model-check-negated';
    static CHECK_NEGATED_DIV = '#model-negated-div';
    static CHECK_ARGS_DIV = '#model-check-args';
    static CHECK_EXPLANATION = '#model-check-explanation';
    static INPUT_ID = 'model-check-input';

    // checking arguments
    static NOT_EMPTY_PATTERN = /^\S+$/g;
    static CHANGE_PATTERN = /^(-=|\+=|=|[+-]|([+-]?)[0-9]+)$/g;
    static TIME_PATTERN = /^([0-9]+)$/g;
    static PROB_PATTERN = /^([0-9]|[1-9][0-9]|100)$/g;
    static RGB_PATTERN = /^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/g;
    static X_PATTERN = /^(-?([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-3][0-9]|240))$/g; // scratch window with -240 - 240
    static Y_PATTERN = /^(-?([0-9]|[1-9][0-9]|1[0-7][0-9]|180))$/g; // scratch window height -180 - 180
    static INVALID_INPUT_CLASS = 'model-invalid-input';

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
                multiselect: true,
                dragNodes: true,
                dragView: true
            },
            layout: {
                hierarchical: {enabled: false},
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

        // setup gui
        this.setUpGUI();
        this.setupGeneralSettings();
        this.setupNodeConfiguration();
        this.setupEdgeConfiguration();
        this.setUpClickEvents();

        this.addTab(i18n.t('modelEditor:tabContent') + "1", 0);
        this.nextTabIndex = 2;
        this.changeToTab(0);
        this.chosenList = undefined;
        this.checkIndex = -1;
    }

    onLoadEvent() {
        this.models = this.modelTester.getAllModels();
        this.createAllTabs();
        this.changeToTab(0);
        this.showGeneralSettings(0);
    }

// ###################### Graph manipulation ###########################

    addNode(data, callback) {
        if (data.label === "new") {
            data.label = i18n.t('modelEditor:newNode');
        }
        this.models[this.currentTab].nodes.push({id: data.id, label: data.label});
        this.showAddButtons();
        callback(data);
    }

    addEdge(data, callback) {
        console.log(data);
        console.log(this.models);
        if (data.label === undefined) {
            data.label = "";
        }
        if (data.id === undefined) {
            data.id = Math.random().toString(16).slice(2);
        }
        this.models[this.currentTab].edges.push({
            id: data.id,
            label: data.label,
            from: data.from,
            to: data.to,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [],
            effects: []
        });
        this.showAddButtons();
        callback(data);
    }

    insertNewGraph() {
        let id = i18n.t("modelEditor:tabContent") + (this.models.length + 1);
        this.models.push({
            id: id,
            usage: 'program',
            startNodeId: '0',
            nodes: [{id: '0', label: 'start'}],
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

    /** For the currently selected edge by the network save the check in the check div. */
    saveCheck() {
        let type = $(ModelEditor.CHECK_CHOOSER).val();
        let argNumber = checkLabelCodes[type];
        if (argNumber === undefined) {
            argNumber = inputLabelCodes[type];
        }

        let args = [];
        let valid = true;
        for (let i = 0; i < argNumber.length; i++) {
            let element = $('#' + ModelEditor.INPUT_ID + i);
            args[i] = element.val();
            valid = this.checkValidCheckArgument(argNumber[i], args[i]);
            if (argNumber[i] === argType.probValue) {
                args[i] = args[i] / 100;
            }
            if (!valid) {
                element.addClass(ModelEditor.INVALID_INPUT_CLASS);
            }
        }

        // if any arg is empty string or invalid stop and mark it
        if (!valid) {
            return false;
        }

        // get the list that check gets added to
        let edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
        let chosenCheckList;
        if (this.chosenList === "condition") {
            chosenCheckList = edge.conditions;
        } else {
            chosenCheckList = edge.effects;
        }

        let negated = $(ModelEditor.CHECK_NEGATED).prop('checked');
        let name = $(ModelEditor.CHECK_CHOOSER).val();
        if (this.checkIndex !== -1) {
            chosenCheckList[this.checkIndex].args = args;
            chosenCheckList[this.checkIndex].negated = negated;
            chosenCheckList[this.checkIndex].name = name;
        } else {
            let id = Math.random().toString(16).slice(2);
            chosenCheckList.push({id, args, negated, name});
        }

        console.log(this.models[this.currentTab]);
        this.checkIndex = -1;
        this.chosenList = undefined;
        return true;
    }

    checkValidCheckArgument(type, value) {
        switch (type) {
            case argType.change:
                return value.match(ModelEditor.CHANGE_PATTERN);
            case argType.probValue:
                return value.match(ModelEditor.PROB_PATTERN);
            case argType.time:
                return value.match(ModelEditor.TIME_PATTERN);
            case argType.r:
            case argType.g:
            case argType.b:
                return value.match(ModelEditor.RGB_PATTERN);
            case argType.coordX:
                return value.match(ModelEditor.X_PATTERN);
            case argType.coordY:
                return value.match(ModelEditor.Y_PATTERN);
            case argType.spriteNameRegex:
            case argType.varNameRegex:
            case argType.attrName:
            case argType.costumeName:
            case argType.value:
            case argType.functionC:
            case argType.expr:
                return value.match(ModelEditor.NOT_EMPTY_PATTERN);
            default:
                return true;
        }
    }

    getEdgeById(edgeID) {
        for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
            const e = this.models[this.currentTab].edges[i];
            if (e.id === edgeID) {
                return e;
            }
        }
    }

    /** Delete all effects of edges of the current model if there are any */
    deleteEffects() {
        for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
            if (this.models[this.currentTab].edges[i].effects !== []) {
                this.models[this.currentTab].edges[i].effects = [];
            }
        }
    }

    /** Check whether the current model has effects on any edges */
    hasEffects() {
        for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
            if (this.models[this.currentTab].edges[i].effects.length !== 0) {
                return true;
            }
        }
        return false;
    }

    // ############################# Plotting and GUI setup ############################

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

        this.network.setData({nodes: this.nodes, edges: this.edges});
    }

    /**
     * Show the general settings for a model, id, usage etc.
     */
    showGeneralSettings(tabNbr) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).removeClass("hide");
        $(ModelEditor.CONFIG_NODE).addClass("hide");
        $(ModelEditor.CONFIG_EDGE).addClass("hide");
        $(ModelEditor.CHECK_DIV).addClass("hide");

        // load into the header etc
        $(ModelEditor.MODEL_ID_FIELD).val(this.models[tabNbr].id);

        if (this.models[tabNbr].usage === "program" || this.models[tabNbr].usage === undefined) {
            this.changeModelType();
        } else if (this.models[tabNbr].usage === "user") {
            this.changeModelType(true);
        } else {
            this.changeModelType(false, true);
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
        let nodes = cloneDeep(json.nodes);
        for (const node in nodes) {
            if (nodes[node].id === json.startNodeId) {
                nodes[node].color = "rgb(0,151,163)";
                nodes[node].title = i18n.t('modelEditor:startNodeTitle');
            } else if (json.stopAllNodeIds.indexOf(nodes[node].id) !== -1) {
                nodes[node].color = "rgb(102,102,102)";
                nodes[node].font = {color: "rgb(230,230,230)"};
                nodes[node].title = i18n.t('modelEditor:stopAllNodeTitle');
            } else if (json.stopNodeIds.indexOf(nodes[node].id) !== -1) {
                nodes[node].color = "rgb(201,201,201)";
                nodes[node].title = i18n.t('modelEditor:stopNodeTitle');
            }
        }
        return nodes;
    }

    /**
     * Style the edges and move loops to different angles.. Could be solves better if the
     */
    setupEdges(json, nodes) {
        let edges = cloneDeep(json);
        let loops = [];
        let priorities = [];
        nodes.forEach(node => {
            loops[node.id] = [];
            priorities[node.id] = 1;
        })

        for (const edgeId in edges) {
            if (edges[edgeId].from === edges[edgeId].to) {
                loops[edges[edgeId].from].push(edges[edgeId]);
            }
            edges[edgeId].length = 200;
            this.makeLabel(edges[edgeId], priorities[edges[edgeId].from]);
            priorities[edges[edgeId].from]++;
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
                        node.widthConstraint = 80;
                    }
                })
            }
        }

        return edges;
    }

    makeLabel(edge, priority) {
        edge.label = priority + ": " + edge.label + " (" + edge.conditions.length + "|" + edge.effects.length + ")";
    }

    /**
     * Set up gui buttons such as save, apply, add tab etc.
     */
    setUpGUI() {
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

        // layout
        $(ModelEditor.LAYOUT).on('click', () => {
            let value = $(ModelEditor.LAYOUT).val()
            if (value === "none") {
                let newOptions = {...this.options};
                newOptions.layout.hierarchical = {enabled: false};
                newOptions.edges.font = {align: "horizontal"};
                newOptions.edges.length = 200;
                this.network.setOptions(newOptions);
            } else if (value === "treeLR") {
                let newOptions = {...this.options};
                newOptions.layout.hierarchical = {direction: "LR"};
                newOptions.edges.font = {align: "top"};
                this.network.setOptions(newOptions);
            } else if (value === "treeUD") {
                let newOptions = {...this.options};
                newOptions.layout.hierarchical = {direction: "UD"};
                newOptions.edges.font = {align: "horizontal"};
                this.network.setOptions(newOptions);
            }
            this.network.fit();
        })

        $(ModelEditor.FIT).on('click', () => {
            this.network.fit();
        })
    }

    /**
     * Buttons and input fields of general settings
     */
    setupGeneralSettings() {
        $(ModelEditor.MODEL_ID_FIELD).on('keyup change', this.onModelIDChange.bind(this));
        $(ModelEditor.PROGRAM_TYPE_CHOICE).on('click', () => this.checkForTypeChange("program"));
        $(ModelEditor.USER_TYPE_CHOICE).on('click', () => this.checkForTypeChange("user"))
        $(ModelEditor.END_TYPE_CHOICE).on('click', () => this.checkForTypeChange("end"));
        $(ModelEditor.MODEL_DELETE_BUTTON).on('click', this.onDeleteModelButton.bind(this));
    }

    checkForTypeChange(newType) {
        // if there are no effects of a program model than save it
        if (!this.hasEffects()) {
            this.models[this.currentTab].usage = newType;
            return;
        }

        this.showConfirmPopup(i18n.t('modelEditor:effectsError'), () => {
            this.deleteEffects();
            this.models[this.currentTab].usage = newType;
            this.loadModel(this.currentTab);
        }, () => {
            if (this.models[this.currentTab].usage === "program") {
                this.changeModelType();
            } else if (this.models[this.currentTab].usage === "user") {
                this.changeModelType(true);
            } else {
                this.changeModelType(false, true);
            }
        })

    }

    changeModelType(userModel = false, endModel = false) {
        $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', !userModel && !endModel);
        $(ModelEditor.USER_TYPE_CHOICE).prop('checked', userModel);
        $(ModelEditor.END_TYPE_CHOICE).prop('checked', endModel);
    }

    /**
     * Buttons and input fields on node select
     */
    setupNodeConfiguration() {
        $(ModelEditor.CONFIG_NODE_LABEL).on('keyup change', () => {
            let text = $(ModelEditor.CONFIG_NODE_LABEL).val();

            let currentNodeID = this.network.getSelectedNodes()[0];
            for (let i = 0; i < this.models[this.currentTab].nodes.length; i++) {
                if (this.models[this.currentTab].nodes[i].id === currentNodeID) {
                    this.models[this.currentTab].nodes[i].label = text;
                    break;
                }
            }
            let selection = this.network.getSelection();
            this.loadModel(this.currentTab);
            this.network.setSelection(selection);
        })
        $(ModelEditor.CONFIG_NODE_STOP1).on('click', () => {
            if ($(ModelEditor.CONFIG_NODE_STOP1).prop('checked')) {
                this.models[this.currentTab].stopNodeIds.push(this.network.getSelectedNodes()[0]);
            } else {
                let index = this.models[this.currentTab].stopNodeIds.indexOf(this.network.getSelectedNodes()[0]);
                this.models[this.currentTab].stopNodeIds.splice(index, 1);
            }
            this.loadModel(this.currentTab);
        })
        $(ModelEditor.CONFIG_NODE_STOP2).on('click', () => {
            // when its a stop all node it is also a stop node
            if ($(ModelEditor.CONFIG_NODE_STOP2).prop('checked')) {
                $(ModelEditor.CONFIG_NODE_STOP1).prop('checked', true);
                $(ModelEditor.CONFIG_NODE_STOP1).attr("disabled", true);
                this.models[this.currentTab].stopAllNodeIds.push(this.network.getSelectedNodes()[0]);
                this.models[this.currentTab].stopNodeIds.push(this.network.getSelectedNodes()[0]);
            } else {
                $(ModelEditor.CONFIG_NODE_STOP1).removeAttr("disabled");
                let index = this.models[this.currentTab].stopAllNodeIds.indexOf(this.network.getSelectedNodes()[0]);
                this.models[this.currentTab].stopAllNodeIds.splice(index, 1);
            }
            this.loadModel(this.currentTab);
        })
    }

    /**
     * Buttons and input fields on edge select
     */
    setupEdgeConfiguration() {
        $(ModelEditor.CONFIG_EDGE_LABEL).on('keyup change', () => {
            let text = $(ModelEditor.CONFIG_EDGE_LABEL).val();

            let currentEdge = this.network.getSelectedEdges()[0];
            for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
                if (this.models[this.currentTab].edges[i].id === currentEdge) {
                    this.models[this.currentTab].edges[i].label = text;
                    break;
                }
            }
            let selection = this.network.getSelection();
            this.loadModel(this.currentTab);
            this.network.setSelection(selection);
        })

        $(ModelEditor.CHECK_CHOOSER).on('change', () => {
            let value = $(ModelEditor.CHECK_CHOOSER).val();
            this.showEmptyArgsForCheckType(value);
            this.addExplanation(value);
        })
        $(ModelEditor.ADD_CONDITION).on('click', () => this.addConditionAction())
        $(ModelEditor.ADD_EFFECT).on('click', () => this.addEffectAction())
        $(ModelEditor.CHECK_BACK).on('click', () => {
            $(ModelEditor.CHECK_DIV).addClass('hide');
            $(ModelEditor.CONFIG_EDGE).removeClass('hide');
        })

        $(ModelEditor.CHECK_SAVE).on('click', () => {
            if (this.saveCheck()) {
                let selection = this.network.getSelection();
                this.loadModel(this.currentTab);
                this.network.setSelection(selection);
                this.showEdgeOptions(this.network.getSelectedEdges()[0]);
            } else {
                this.showPopup(i18n.t('modelEditor:notValid'));
            }
        });
        $(ModelEditor.FORCE_TEST_AT).on('keyup change', () => {
            let field = $(ModelEditor.FORCE_TEST_AT);
            let value = field.val();
            if (value.match(ModelEditor.TIME_PATTERN) == null) {
                field.addClass(ModelEditor.INVALID_INPUT_CLASS);
            } else {
                field.removeClass(ModelEditor.INVALID_INPUT_CLASS);

                let edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
                edge.forceTestAt = parseInt(value);
                console.log(this.models[this.currentTab])
            }
        });
        $(ModelEditor.FORCE_TEST_AFTER).on('keyup change', () => {
            let field = $(ModelEditor.FORCE_TEST_AFTER);
            let value = field.val();
            if (value.match(ModelEditor.TIME_PATTERN) == null) {
                field.addClass(ModelEditor.INVALID_INPUT_CLASS);
            } else {
                field.removeClass(ModelEditor.INVALID_INPUT_CLASS);

                let edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
                edge.forceTestAfter = parseInt(value);
                console.log(this.models[this.currentTab])
            }
        })
    }

    addConditionAction() {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:newCondition'));
        $(ModelEditor.CHECK_CHOOSER).children().remove();
        $(ModelEditor.CHECK_NEGATED).prop('checked', false);

        let checkNames = Object.keys(checkLabelCodes).sort((a, b) => a < b ? -1 : 0);
        checkNames.forEach(name => {
            $(ModelEditor.CHECK_CHOOSER).append($('<option/>', {value: name}).text(name));
        })

        $(ModelEditor.CHECK_CHOOSER).val("AttrChange");
        this.showEmptyArgsForCheckType("AttrChange");
        this.checkIndex = -1;
        this.chosenList = "condition";
        this.addExplanation("AttrChange");
    }


    addEffectAction() {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:newEffect'));
        $(ModelEditor.CHECK_CHOOSER).children().remove();
        $(ModelEditor.CHECK_NEGATED).prop('checked', false);

        let checkNames;
        let defValue;
        if (this.models[this.currentTab].usage === "user") {
            defValue = "InputClickSprite";
            checkNames = Object.keys(inputLabelCodes).sort((a, b) => a < b ? -1 : 0);
            $(ModelEditor.CHECK_NEGATED_DIV).addClass('hide');
        } else {
            defValue = "AttrChange";
            checkNames = Object.keys(checkLabelCodes).sort((a, b) => a < b ? -1 : 0);
            $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
        }

        checkNames.forEach(name => {
            $(ModelEditor.CHECK_CHOOSER).append($('<option/>', {value: name}).text(name));
        })

        $(ModelEditor.CHECK_CHOOSER).val(defValue);
        this.showEmptyArgsForCheckType(defValue);
        this.chosenList = "effect";
        this.checkIndex = -1;
        this.addExplanation("AttrChange");
    }

    hideAddButtons() {
        $(ModelEditor.STANDARD_DIV).addClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).removeClass("hide");
        $(ModelEditor.DELETE_DIV).addClass("hide");
    }

    showAddButtons() {
        $(ModelEditor.STANDARD_DIV).removeClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).addClass("hide");
        $(ModelEditor.DELETE_DIV).addClass("hide");
    }

    showDeleteButton() {
        $(ModelEditor.STANDARD_DIV).addClass("hide");
        $(ModelEditor.CANCEL_ADD_DIV).addClass("hide");
        $(ModelEditor.DELETE_DIV).removeClass("hide");
    }

    /**
     * Change the view to a model based on a clicked tab.
     * @param tabNr Number of the tab
     */
    changeToTab(tabNr) {
        this.loadModel(parseInt(tabNr));

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
        let json = JSON.stringify(this.models, null, 4);
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
        this.changeToTab(this.currentTab === 0 ? 0 : this.currentTab - 1);
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
                this.chosenEdge = undefined;
            } else {
                this.showDeleteButton();
                if (data.nodes.length === 1) {
                    this.showNodeOptions(data.nodes[0]);
                } else if (data.edges.length === 1 && data.nodes.length === 0) {
                    this.showEdgeOptions(data.edges[0]);
                }
            }
        })
        this.network.on('dragging', () => {
            this.showGeneralSettings(this.currentTab);
            this.network.unselectAll();
        })
    }

    showNodeOptions(nodeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass("hide");
        $(ModelEditor.CONFIG_NODE).removeClass("hide");
        $(ModelEditor.CONFIG_EDGE).addClass("hide");
        $(ModelEditor.CHECK_DIV).addClass("hide");

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
        if (this.models[this.currentTab].stopNodeIds.indexOf(node.id) !== -1) {
            $(ModelEditor.CONFIG_NODE_STOP1).prop('checked', true);
        } else {
            $(ModelEditor.CONFIG_NODE_STOP1).prop('checked', false);
        }
        if (this.models[this.currentTab].stopAllNodeIds.indexOf(node.id) !== -1) {
            $(ModelEditor.CONFIG_NODE_STOP2).prop('checked', true);
            $(ModelEditor.CONFIG_NODE_STOP1).prop('checked', true);
            $(ModelEditor.CONFIG_NODE_STOP1).attr("disabled", true);
        } else {
            $(ModelEditor.CONFIG_NODE_STOP2).prop('checked', false);
            $(ModelEditor.CONFIG_NODE_STOP1).attr("disabled", false);
        }
        if (this.models[this.currentTab].startNodeId === node.id) {
            $(ModelEditor.CONFIG_NODE_STOP1).attr("disabled", true);
            $(ModelEditor.CONFIG_NODE_STOP2).attr("disabled", true);
        } else {
            $(ModelEditor.CONFIG_NODE_STOP1).attr("disabled", false);
            $(ModelEditor.CONFIG_NODE_STOP2).attr("disabled", false);
        }

        this.showPriorityChanger(nodeID, node);
    }

    /** to sort the edge priorities */
    showPriorityChanger(nodeID, node) {
        let outgoingEdges = this.models[this.currentTab].edges.filter(edge => {
            return edge.from === nodeID;
        })

        let tag = 'model-priority-row';
        $(ModelEditor.PRIORITY_CHANGER).children('.' + tag).remove();

        if (outgoingEdges.length <= 1) {
            $(ModelEditor.PRIORITY_CHANGER_DIV).addClass("hide");
        } else {
            $(ModelEditor.PRIORITY_CHANGER_DIV).removeClass("hide");

            let oldValues = [];
            for (let i = 0; i < outgoingEdges.length; i++) {
                let select = $('<select/>', {name: "model-priority" + i, id: tag + i, style: "min-width:200px"});

                outgoingEdges.forEach(edge => {
                    select.append($('<option/>', {value: edge.id}).text(edge.label));
                })
                select.val(outgoingEdges[i].id);
                oldValues.push(outgoingEdges[i].id);

                select.change(() => {
                    this.setPriority(node, oldValues[i], select.val(), oldValues);
                });

                $(ModelEditor.PRIORITY_CHANGER).append(
                    $('<div/>', {class: "row mt-1 " + tag}).append(
                        $('<div/>', {class: "col-2"}).append($('<label/>').html("<b>" + (i + 1) + ".</b>"))
                    ).append(
                        $('<div/>', {class: "col"}).append(select)
                    ))
            }
        }
    }

    /** set the edge with edgeID of node to the new position */
    setPriority(node, oldEdgeId, edgeID) {
        let firstIndex = -1;
        let secondIndex = -1;

        for (let i = 0; i < this.models[this.currentTab].edges.length; i++) {
            if (this.edges[i].id === oldEdgeId) {
                firstIndex = i;
            } else if (this.edges[i].id === edgeID) {
                secondIndex = i;
            }
        }
        let temp = this.models[this.currentTab].edges[firstIndex];
        this.models[this.currentTab].edges[firstIndex] = this.models[this.currentTab].edges[secondIndex];
        this.models[this.currentTab].edges[secondIndex] = temp;

        let selection = this.network.getSelectedNodes();
        this.loadModel(this.currentTab);
        this.network.selectNodes(selection);
        this.showNodeOptions(node.id);
    }

    showEdgeOptions(edgeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass("hide");
        $(ModelEditor.CONFIG_NODE).addClass("hide");
        $(ModelEditor.CONFIG_EDGE).removeClass("hide");
        $(ModelEditor.CHECK_DIV).addClass("hide");

        // get the corresponding edge
        let edge = this.getEdgeById(edgeID);

        $(ModelEditor.CONFIG_EDGE_LABEL).val(edge.label);
        // clear the conditions and effects
        $(ModelEditor.CONDITIONS).children().remove();
        $(ModelEditor.EFFECTS).children().remove();

        let isAUserModel = this.models[this.currentTab].usage === "user";
        if (edge.conditions.length > 0) {
            $(ModelEditor.CONDITIONS).append(this.getCheckElement(edge.conditions[0], 0))
            for (let i = 1; i < edge.conditions.length; i++) {
                $(ModelEditor.CONDITIONS).append($('<hr/>', {class: 'model-check-line'}))
                    .append(this.getCheckElement(edge.conditions[i], i, isAUserModel))
            }
        }

        // fill up effects of current edge
        if (edge.effects.length > 0) {
            $(ModelEditor.EFFECTS).append(this.getCheckElement(edge.effects[0], 0, true, isAUserModel))
            for (let i = 1; i < edge.effects.length; i++) {
                $(ModelEditor.EFFECTS).append($('<hr/>', {class: 'model-check-line'}))
                    .append(this.getCheckElement(edge.effects[i], i, true, isAUserModel));
            }
        }

        // force timers
        if (edge.forceTestAfter && edge.forceTestAfter !== -1) {
            $(ModelEditor.FORCE_TEST_AFTER).val(edge.forceTestAfter);
        }
        if (edge.forceTestAt && edge.forceTestAt !== -1) {
            $(ModelEditor.FORCE_TEST_AT).val(edge.forceTestAt);
        }
    }

    showCheckOptions(check, isAnEffect = false, isAUserModel = false) {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        let checkNames;
        console.log(check, isAnEffect, isAUserModel);

        if (!isAnEffect) {
            $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:condition'));
            $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
            checkNames = Object.keys(checkLabelCodes).sort((a, b) => a < b ? -1 : 0);
        } else if (isAnEffect) {
            $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:effect'))
            if (isAUserModel) {
                $(ModelEditor.CHECK_NEGATED_DIV).addClass('hide');
                checkNames = Object.keys(inputLabelCodes).sort((a, b) => a < b ? -1 : 0);
            } else {
                $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
                checkNames = Object.keys(checkLabelCodes).sort((a, b) => a < b ? -1 : 0);
            }
        }

        checkNames.forEach(name => {
            $(ModelEditor.CHECK_CHOOSER).append($('<option/>', {value: name}).text(name));
        })

        $(ModelEditor.CHECK_NEGATED).prop('checked', check.negated);
        $(ModelEditor.CHECK_CHOOSER).val(check.name);
        this.changeCheckType(check.name, check.id, check.args);

        this.addExplanation(check.name);
    }

    addExplanation(type) {
        $(ModelEditor.CHECK_EXPLANATION).children().remove();
        let argTypes = checkLabelCodes[type];
        if (argTypes === undefined) {
            argTypes = inputLabelCodes[type];
        }
        console.log(argTypes, i18n.t('modelEditor:' + type));
        let children = [];
        for (let i = 0; i < argTypes.length; i++) {
            let hint = i18n.t('modelEditor:' + argTypes[i] + "Hint");
            if (hint !== argTypes[i] + "Hint") {
                children.push($('<label/>', {style: "ml-1"}).text(hint));
            }
        }

        if (children.length > 0) {
            $(ModelEditor.CHECK_EXPLANATION).append($('<label/>').text(i18n.t('modelEditor:hintTitle')));
            for (let i = 0; i < children.length; i++) {
                $(ModelEditor.CHECK_EXPLANATION).append(children[i]);
            }
        }
    }

    /**
     * Show argument inputs for a new check of a type.
     */
    showEmptyArgsForCheckType(type) {
        $(ModelEditor.CHECK_ARGS_DIV).children().remove();

        let argNames = checkLabelCodes[type];
        if (argNames === undefined) {
            argNames = inputLabelCodes[type];
        }
        for (let i = 0; i < argNames.length; i++) {
            this.appendInputBasedOnType(argNames[i], placeholders[argNames[i]], i);
        }
    }

    /**
     * Show check argument inputs for the chosen type.
     * @param type Type of check, has to be of checkLabelCodes
     * @param id Id of the check.
     * @param args Arguments of the check
     */
    changeCheckType(type, id, args) {
        let argNames = checkLabelCodes[type];
        if (argNames === undefined) {
            argNames = inputLabelCodes[type];
        }

        if (args.length !== argNames.length) {
            console.error('Loaded model has a check with wrong number of arguments. Check.id:' + id);
        }
        $(ModelEditor.CHECK_ARGS_DIV).children().remove();

        for (let i = 0; i < argNames.length; i++) {
            this.appendInputBasedOnType(argNames[i], args[i], i);
        }
    }

    appendInputBasedOnType(type, value, i) {
        switch (type) {
            case argType.spriteNameRegex:
                this.appendInputWithPattern(i18n.t('modelEditor:spriteName'), value,
                    ModelEditor.NOT_EMPTY_PATTERN, i, undefined, undefined, "(Regex)");
                break;
            case argType.varNameRegex:
                this.appendInputWithPattern(i18n.t('modelEditor:varName'), value,
                    ModelEditor.NOT_EMPTY_PATTERN, i, undefined, undefined, "(Regex)");
                break;
            case argType.attrName:
                this.appendInputWithPattern(i18n.t('modelEditor:attrName'), value,
                    ModelEditor.NOT_EMPTY_PATTERN, i);
                break;
            case argType.costumeName:
                this.appendInputWithPattern(i18n.t('modelEditor:costumeName'), value,
                    ModelEditor.NOT_EMPTY_PATTERN, i);
                break;
            case argType.value:
                this.appendInputWithPattern(i18n.t('modelEditor:value'), value,
                    ModelEditor.NOT_EMPTY_PATTERN, i);
                break;
            case argType.change:
                this.appendInputWithPattern(i18n.t("modelEditor:change"), value, ModelEditor.CHANGE_PATTERN, i);
                break;
            case argType.comp:
                this.appendComparisonSelection(value, i);
                break;
            case argType.probValue:
                this.appendInputWithPattern(i18n.t("modelEditor:prob"), value * 100,
                    ModelEditor.PROB_PATTERN, i, "max-width:60px; position:absolute; right:5px", "%");
                break;
            case argType.time:
                this.appendInputWithPattern(i18n.t("modelEditor:time"), value, ModelEditor.TIME_PATTERN,
                    i, "max-width:60px;position:absolute; right:5px", "ms");
                break;
            case argType.keyName:
                this.appendKeys(value, i);
                break;
            case argType.bool:
                this.appendBool(value, i);
                break;
            case argType.r:
                this.appendInputWithPattern(i18n.t("modelEditor:rValue"), value, ModelEditor.RGB_PATTERN,
                    i, "max-width:60px;");
                break;
            case argType.g:
                this.appendInputWithPattern(i18n.t("modelEditor:gValue"), value, ModelEditor.RGB_PATTERN,
                    i, "max-width:60px;");
                break;
            case argType.b:
                this.appendInputWithPattern(i18n.t("modelEditor:bValue"), value, ModelEditor.RGB_PATTERN,
                    i, "max-width:60px;");
                break;
            case argType.coordX:
                this.appendInputWithPattern(i18n.t("modelEditor:xCoord"), value, ModelEditor.X_PATTERN,
                    i, "max-width:60px;");
                break;
            case argType.coordY:
                this.appendInputWithPattern(i18n.t("modelEditor:yCoord"), value, ModelEditor.Y_PATTERN,
                    i, "max-width:60px;");
                break;
            case argType.functionC:
                this.appendAreaInput(i18n.t('modelEditor:function'), value, "javascript code...",
                    i);
                break;
            case argType.expr:
                this.appendAreaInput(i18n.t('modelEditor:expr'), value, "expression ...", i);
                break;
        }
    }

    appendAreaInput(title, value, placeholder, idNbr) {
        let textarea = $('<textarea/>', {
            class: "col mr-2", style: "overflow:auto;", rows: 6,
            id: ModelEditor.INPUT_ID + idNbr, placeholder: placeholder
        }).val(value).on('keyup change', () => {
            if (textarea.val().match(ModelEditor.NOT_EMPTY_PATTERN) != null) {
                textarea.removeClass(ModelEditor.INVALID_INPUT_CLASS);
            } else {
                textarea.addClass(ModelEditor.INVALID_INPUT_CLASS);
            }
        });
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: "row"}).append(
            $('<div/>', {class: "col mt-1"}).append($('<label/>').text(title))
        )).append($('<div/>', {class: "row"}).append(textarea));
    }

    appendInputWithPattern(title, value, pattern, idNbr, style = undefined, unit = undefined,
                           placeholder = undefined) {
        let id = ModelEditor.INPUT_ID + idNbr;
        let row = $('<div/>', {class: "row"}).append(
            $('<div/>', {class: "col-4 mt-1"}).append($('<label/>').text(title))
        ).append(
            $('<div/>', {class: "col"}).append($('<input/>', {id: id, style: style, placeholder: placeholder})
                .val(value).on('keyup change', () => {
                    let queryID = '#' + id;
                    if ($(queryID).val().match(pattern) != null) {
                        $(queryID).removeClass(ModelEditor.INVALID_INPUT_CLASS);
                    } else {
                        $(queryID).addClass(ModelEditor.INVALID_INPUT_CLASS);
                    }
                })
            ));

        if (unit) {
            row.append($('<div/>', {
                class: "col-1 mt-1 mr-1",
                style: "padding-left:0;"
            }).append($('<label/>').text(unit)));
        }
        $(ModelEditor.CHECK_ARGS_DIV).append(row);
    }

    appendComparisonSelection(value, idNbr) {
        let id = ModelEditor.INPUT_ID + idNbr;
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: "row"}).append(
            $('<div/>', {class: "col-4 mt-1"}).append($('<label/>').text(i18n.t('modelEditor:comp')))
        ).append(
            $('<div/>', {class: "col mt-1", style: "float:left;"}).append(
                $('<select/>', {name: 'selectChange' + idNbr, id: id})
                    .append($('<option/>', {value: '='}).text('=='))
                    .append($('<option/>', {value: '>'}).text('>'))
                    .append($('<option/>', {value: '<'}).text('<'))
                    .append($('<option/>', {value: '>='}).text('>='))
                    .append($('<option/>', {value: '<='}).text('<=')).val(value)
            )
        ));
    }

    appendKeys(value, idNbr) {
        let id = ModelEditor.INPUT_ID + idNbr;
        let select = $('<select/>', {name: 'selectKey' + idNbr, id: id});
        for (let i = 0; i < keys.length; i++) {
            select.append($('<option/>', {value: keys[i]}).text(keys[i]));
        }
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: "row"}).append(
            $('<div/>', {class: "col-4 mt-1"}).append($('<label/>').text(i18n.t('modelEditor:key')))
        ).append($('<div/>', {class: "col mt-1", style: "float:left;"}).append(select)));
        select.val(value);
    }

    appendBool(value, idNbr) {
        let id = ModelEditor.INPUT_ID + idNbr;
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: "row"}).append(
            $('<div/>', {class: "col-4 mt-1"}).append($('<label/>').text(i18n.t('modelEditor:comp')))
        ).append(
            $('<div/>', {class: "col mt-1", style: "float:left;"}).append(
                $('<select/>', {name: 'selectBool' + idNbr, id: id})
                    .append($('<option/>', {value: 'true'}).text(i18n.t('modelEditor:true')))
                    .append($('<option/>', {value: 'false'}).text(i18n.t('modelEditor:false'))).val(value)
            )
        ));
    }

    /** Append a row element that shows a condition or effect and its arguments.     */
    getCheckElement(check, index, isAnEffect = false, isAUserModel = false) {
        let name = (check.negated ? "!" : "") + check.name + "(" + check.args + ")";
        return $('<div/>', {class: 'model-check'}).append($('<label/>', {class: 'model-check'}).text(name))
            .click(() => {
                this.checkIndex = index;
                this.chosenList = isAnEffect ? "effect" : "condition";
                this.showCheckOptions(check, isAnEffect, isAUserModel);
            });
    }

    /** for fixing model position after loading the element */
    reposition() {
        this.network.fit();
    }
}

module.exports = ModelEditor;
