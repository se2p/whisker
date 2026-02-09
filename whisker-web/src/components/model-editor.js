/* eslint-disable valid-jsdoc */

const {
    ModelTester, attributeAndEffectNames, keys,
    convertArgs, convertInputArgs, checkToString
} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const cloneDeep = require('lodash.clonedeep');
const {i18n} = require('../index');
const {argType, checkLabelCodes, placeholders, inputLabelCodes} = require('./model-editor-labelCodes');
const logger = require('../logger');

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
    static SAVE_PROGRAM_MODEL_BUTTON = '#model-editor-save-model';
    static SAVE_USER_MODEL_BUTTON = '#model-editor-save-user-model';
    static MINIMIZE_MODELS = '#model-minimize-btn';
    static APPLY_BUTTON = '#model-editor-apply';
    static ADD_NODE = '#model-add-node';
    static ADD_EDGE = '#model-add-edge';
    static CANCEL_ADD = '#model-cancel-add';
    static ADD_BUTTONS_DIV = '.model-add-buttons-div';
    static CANCEL_ADD_DIV = '.model-cancel-add-div';
    static EXPLANATION = '#model-explanation';
    static DELETE_DIV = '.model-delete-div';
    static DELETE_SELECTION = '#model-delete-selection';
    static LAYOUT = '#model-layout';
    static FIT = '#model-fit';

    // configuration right pane, node settings
    static CONFIG_NODE = '#model-node-configuration';
    static CONFIG_NODE_LABEL = '#model-node-label';
    static CONFIG_NODE_STOP_ALL = '#model-stopAllNode';
    static PRIORITY_CHANGER = '#model-priority-changer'
    static PRIORITY_CHANGER_DIV = '.model-priority-div'

    // configuration right pane, edge settings
    static CONFIG_EDGE = '#model-edge-configuration';
    static CONFIG_EDGE_LABEL = '#model-edge-label';
    static EFFECT_OR_INPUT_LABEL = '#model-effect-or-input-label';
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
    static CHANGE_PATTERN = /^(-=|\+=|==|[+-]|!=|([+-]?)([0-9]+\.)?[0-9]+)$/g;
    static TIME_PATTERN = /^([0-9]+)$/g;
    static PROB_PATTERN = /^([0-9]|[1-9][0-9]|100)$/g;
    static RGB_PATTERN = /^([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$/g;
    // TODO: These patterns match everything, thus it's not really necessary to check them, and they could be removed.
    //  But currently, we still need them as a workaround, because appendInputWithPattern() expects a regex as argument.
    static X_PATTERN = /^.*$/g; // can be either a number or an expr which could be anything
    static Y_PATTERN = /^.*$/g; // can be either a number or an expr which could be anything
    static LAYER_PATTERN = /(First,Last)$/; // can be either a number or an expr which could be anything

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
            nodes: {
                physics: false
            },
            edges: {
                arrows: {from: {enabled: false}, to: {enabled: true}}
            },
            interaction: {
                multiselect: true,
                dragNodes: true,
                dragView: true
            },
            layout: {
                hierarchical: {enabled: false}
            },
            physics: {
                enabled: true,
                barnesHut: {centralGravity: 0.1}
            },
            manipulation: {
                enabled: false,
                addNode: this.addNode.bind(this),
                addEdge: this.addEdge.bind(this)
            },
            locale: $('#lang-select').val(),
            clickToUse: false,
            height: '420px',
            autoResize: true
        };
        this.data = {nodes: [{id: 'start', label: 'start', color: 'rgb(0,151,163)'}], edges: []};
        this.network = new vis.Network($('#model-editor-canvas')[0], this.data, this.options);
        this.network.focus('start');
        this.network.on('resize', () => this.network.fit());

        // setup gui
        this.setUpGUI();
        this.setupGeneralSettings();
        this.setupNodeConfiguration();
        this.setupEdgeConfiguration();
        this.setUpClickEvents();

        this.addTab(`${i18n.t('modelEditor:tabContent')}1`, 0);
        this.nextTabIndex = 2;
        this.changeToTab(0);
        this.chosenList = null;
        this.checkIndex = -1;
    }

    onLoadEvent() {
        this.models = this.modelTester.getAllModels();
        if (this.models.length === 0) {
            this.insertNewGraph();
        }
        this.createAllTabs();
        this.changeToTab(0);
        this.showGeneralSettings(0);
    }

    removeCheck(check) {
        const edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
        for (let i = 0; i < edge.conditions.length; i++) {
            if (edge.conditions[i] === check) {
                edge.conditions.splice(i, 1);
                return;
            }
        }
        for (let i = 0; i < edge.effects.length; i++) {
            if (edge.effects[i] === check) {
                edge.effects.splice(i, 1);
                return;
            }
        }
    }

    // ###################### Graph manipulation ###########################

    addNode(data, callback) {
        if (data.label === 'new') {
            data.label = i18n.t('modelEditor:newNode');
        }
        this.currentModel.nodes.push({id: data.id, label: data.label});
        this.showAddButtons();
        callback(data);
    }

    addEdge(data, callback) {
        if (this.currentModel.stopAllNodeIds.includes(data.from)) {
            this.showPopup(i18n.t('modelEditor:errEdgeStopAllNode'));
            return;
        }
        data.label = data.label ?? '';
        data.id = data.id ?? Math.random().toString(16)
            .slice(2);
        this.currentModel.edges.push({
            id: data.id,
            label: data.label,
            from: data.from,
            to: data.to,
            forceTestAfter: -1,
            forceTestAt: -1,
            conditions: [],
            effects: []
        });
        callback(data);
        this.loadModel(this.currentTab);
        this.showAddButtons();
    }

    insertNewGraph() {
        const id = i18n.t('modelEditor:tabContent') + (this.models.length + 1);
        this.models.push({
            id: id,
            usage: 'program',
            startNodeId: 'start',
            nodes: [{id: 'start', label: 'start'}],
            stopAllNodeIds: [],
            edges: []
        });
    }

    get currentModel() {
        return this.models[this.currentTab];
    }

    deleteCurrentModel() {
        this.models.splice(this.currentTab, 1);
    }

    /**
     * Delete the selected nodes and edges from the graph, only if the start node is not contained.
     * @return {boolean} Whether they were deleted.
     */
    deleteSelection() {
        const selection = this.network.getSelection();

        if (selection.nodes.includes(this.currentModel.startNodeId)) {
            return false;
        }
        this.currentModel.stopAllNodeIds =
            this.getNotRemovedOnesByString(this.currentModel.stopAllNodeIds, selection.nodes);
        this.currentModel.nodes =
            this.getNotRemovedOnesByID(this.currentModel.nodes, selection.nodes);
        this.currentModel.edges =
            this.getNotRemovedOnesByID(this.currentModel.edges, selection.edges);
        return true;
    }

    getNotRemovedOnesByString(original, toRemove) {
        return original.filter(item => !toRemove.includes(item));
    }

    getNotRemovedOnesByID(original, toRemove) {
        return original.filter(item => !toRemove.includes(item.id));
    }

    /** For the currently selected edge by the network save the check in the check div. */
    saveCheck() {
        const name = $(ModelEditor.CHECK_CHOOSER).val();
        const negated = $(ModelEditor.CHECK_NEGATED).prop('checked');
        let args = [];
        const argNumber = checkLabelCodes[name] ?? inputLabelCodes[name];
        for (let i = 0; i < argNumber.length; i++) {
            args[i] = $(`#${ModelEditor.INPUT_ID}${i}`).val();
        }
        const isUserInput = this.currentModel.usage === 'user' &&
            document.getElementById('model-check-label').attributes['data-i18n'].value === 'modelEditor:userInput';
        const result = isUserInput ?
            convertInputArgs({name: name, args: args}) :
            convertArgs({name: name, negated: negated, args: args});
        const valid = result.passed;
        if (!valid) {
            const codes = [];
            for (let index = 0; index < argNumber.length; index++) {
                const element = $(`#${ModelEditor.INPUT_ID}${index}`);
                const code = result.problems[index];
                if (code) {
                    element.addClass(ModelEditor.INVALID_INPUT_CLASS);
                    const translatedCode = i18n.t(`modelEditor:${code}`);
                    const argTranslation = i18n.t(`modelEditor:${argNumber[index]}`);
                    codes.push(`${argTranslation}: ${translatedCode}`);
                    element.attr('title', translatedCode);
                } else {
                    element.removeClass(ModelEditor.INVALID_INPUT_CLASS);
                    element.removeAttr('title');
                }
            }
            return {status: false, message: codes.join('<br>')};
        }

        args = result.data;


        // get the list that check gets added to
        const edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
        const chosenCheckList = this.chosenList === 'condition' ? edge.conditions : edge.effects;
        if (this.checkIndex === -1) {
            chosenCheckList.push({name: name, negated: negated, args: args});
        } else {
            chosenCheckList[this.checkIndex].name = name;
            chosenCheckList[this.checkIndex].negated = negated;
            chosenCheckList[this.checkIndex].args = args;
        }
        this.checkIndex = -1;
        this.chosenList = null;
        return {status: true, message: ''};
    }

    getEdgeById(edgeID) {
        return this.currentModel.edges.find(e => e.id === edgeID);
    }

    /** Delete all effects of edges of the current model if there are any */
    deleteEffects() {
        for (const edge of this.currentModel.edges) {
            edge.effects = [];
        }
    }

    /** Check whether the current model has effects on any edges */
    hasEffects() {
        return this.currentModel.edges.some(e => e.effects.length > 0);
    }

    // ############################# Plotting and GUI setup ############################

    loadModel(tabNbr = 0) {
        if (tabNbr < 0 || tabNbr >= this.models.length) {
            throw Error('Tab number negative or higher than number of models.');
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
        $(ModelEditor.GENERAL_SETTINGS_DIV).removeClass('hide');
        $(ModelEditor.CONFIG_NODE).addClass('hide');
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).addClass('hide');

        // load into the header etc
        $(ModelEditor.MODEL_ID_FIELD).val(this.models[tabNbr].id);

        this.changeModelType(this.models[tabNbr].usage);

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
        const nodes = cloneDeep(json.nodes);
        for (const node in nodes) {
            if (nodes[node].id === json.startNodeId) {
                nodes[node].color = 'rgb(0,151,163)';
                nodes[node].title = i18n.t('modelEditor:startNodeTitle');
            } else if (json.stopAllNodeIds.includes(nodes[node].id)) {
                nodes[node].color = 'rgb(102,102,102)';
                nodes[node].font = {color: 'rgb(230,230,230)'};
                nodes[node].title = i18n.t('modelEditor:stopAllNodeTitle');
            }
        }
        return nodes;
    }

    /**
     * Style the edges and move loops to different angles.. Could be solves better if the
     */
    setupEdges(json, nodes) {
        const edges = cloneDeep(json);
        const loops = [];
        const priorities = [];
        nodes.forEach(node => {
            loops[node.id] = [];
            priorities[node.id] = 1;
        });

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
                    edge.selfReference = {angle: (i + 1) * loops[nodeId].length};
                    edge.font = {align: 'horizontal'};
                    if (i % 2 === 0) {
                        edge.font.vadjust = -20 - loops[nodeId].length;
                    } else {
                        edge.font.vadjust = 20 + loops[nodeId].length;
                    }
                    i++;
                });
                nodes.forEach(node => {
                    if (node.id === nodeId) {
                        node.widthConstraint = 80;
                    }
                });
            }
        }

        this.routeParallelEdgesAsSymmetricArcs(edges);

        return edges;
    }

    /**
     * Tries to route parallel edges as symmetric arcs. We draw an imaginary straight line between the source and target
     * node. Parallel edges between these nodes are then rendered as evenly spaced arcs, such that half of the arcs
     * curve above the straight line, and the other half below that line. If two nodes are connected by just one edge,
     * vis' default routing is used. See Whisker MR !719 for an illustration.
     *
     * @param edges The model's edges
     */
    routeParallelEdgesAsSymmetricArcs(edges) {

        /**
         * Parallel edges grouped by the nodes they connect. The keys represent node ids. The edge direction is ignored.
         * @type {Record<string, Record<string, Object[]>>}
         */
        const parallelEdgesGroupedByNodes = {};

        for (const edge of edges) {
            let {from, to} = edge;

            // To establish groups of parallel edges, it only matters that the edges connect the same nodes. To this,
            // the edge direction must be ignored, which is done by imposing a total order on the nodes via their ids.
            if (from > to) {
                ([from, to] = [to, from]);
            }

            ((parallelEdgesGroupedByNodes[from] ??= {})[to] ??= []).push(edge);
        }

        for (const from of Object.keys(parallelEdgesGroupedByNodes)) {
            for (const to of Object.keys(parallelEdgesGroupedByNodes[from])) {
                const parallelEdges = parallelEdgesGroupedByNodes[from][to];

                if (parallelEdges.length < 2) { // No parallel edges -> no special routing necessary
                    continue;
                }

                const mid = Math.ceil(parallelEdges.length / 2); // Symmetry index
                const gap = Math.min(0.2, 1.0 / (mid + 1)); // The gap by which the edges are evenly spaced

                for (const [i, edge] of parallelEdges.entries()) {
                    const reversed = edge.from !== from; // Recover the direction of the edge

                    edge.smooth = {
                        // The direction of an edge (A -> B vs. B <- A) together with its location above or below the
                        // imaginary straight line between A and B determine whether it should be curved CW or CCW.
                        type: (reversed ^ (i < mid)) ? 'curvedCCW' : 'curvedCW',

                        // Causes roundness to decrease the closer we are to the imaginary straight line
                        roundness: (1 + (i % mid)) * gap
                    };
                }
            }
        }
    }

    makeLabel(edge, priority) {
        edge.label = `${priority}: ${edge.label} (${edge.conditions.length}|${edge.effects.length})`;
    }

    /**
     * Set up gui buttons such as save, apply, add tab etc.
     */
    setUpGUI() {
        // apply and download below model editor
        $(ModelEditor.APPLY_BUTTON).on('click', this.applyButton.bind(this));
        $(ModelEditor.SAVE_PROGRAM_MODEL_BUTTON).on('click', this.downloadProgramModels.bind(this));
        $(ModelEditor.SAVE_USER_MODEL_BUTTON).on('click', this.downloadUserModels.bind(this));
        $(ModelEditor.MINIMIZE_MODELS).on('click', this.minimizeOracleModels.bind(this));

        // tab behaviour
        $(ModelEditor.ADD_TAB).on('click', () => {
            this.insertNewGraph();
            this.addTab(i18n.t('modelEditor:tabContent') + this.nextTabIndex, this.models.length - 1);
            $(ModelEditor.MODEL_ID_FIELD).focus();
            this.nextTabIndex++;
            this.changeToTab(this.models.length - 1);
        });

        // Graph manipulation
        $(ModelEditor.ADD_NODE).on('click', () => {
            $(ModelEditor.EXPLANATION).text(i18n.t('modelEditor:explanationNode'));
            $(ModelEditor.EXPLANATION).attr('data-i18n', 'modelEditor:explanationNode');
            this.hideAddButtons();
            this.network.addNodeMode();
        });
        $(ModelEditor.ADD_EDGE).on('click', () => {
            this.hideAddButtons();
            $(ModelEditor.EXPLANATION).text(i18n.t('modelEditor:explanationEdge'));
            $(ModelEditor.EXPLANATION).attr('data-i18n', 'modelEditor:explanationEdge');
            this.network.addEdgeMode();
        });
        $(ModelEditor.CANCEL_ADD).on('click', () => {
            this.showAddButtons();
            this.network.disableEditMode();
        });
        $(ModelEditor.DELETE_SELECTION).on('click', () => {
            this.showConfirmPopup(i18n.t('modelEditor:deleteSelectionMsg'), () => {
                if (this.deleteSelection()) {
                    this.network.deleteSelected();
                    this.showAddButtons();
                } else {
                    this.showPopup(i18n.t('modelEditor:deletionError'));
                }
            });
        });

        // layout
        $(ModelEditor.LAYOUT).on('click', () => {
            const value = $(ModelEditor.LAYOUT).val();
            if (value === 'none') {
                const newOptions = {...this.options};
                newOptions.layout.hierarchical = {enabled: false};
                newOptions.edges.font = {align: 'horizontal'};
                newOptions.edges.length = 200;
                this.network.setOptions(newOptions);
            } else if (value === 'treeLR') {
                const newOptions = {...this.options};
                newOptions.layout.hierarchical = {direction: 'LR', shakeTowards: 'leaves'};
                newOptions.edges.font = {align: 'top'};
                this.network.setOptions(newOptions);
            } else if (value === 'treeUD') {
                const newOptions = {...this.options};
                newOptions.layout.hierarchical = {direction: 'UD', shakeTowards: 'leaves'};
                newOptions.edges.font = {align: 'horizontal'};
                this.network.setOptions(newOptions);
            }
            this.network.fit();
        });

        $(ModelEditor.FIT).on('click', () => {
            this.network.fit();
        });
    }

    /**
     * Buttons and input fields of general settings
     */
    setupGeneralSettings() {
        $(ModelEditor.MODEL_ID_FIELD).on('keyup change', this.onModelIDChange.bind(this));
        $(ModelEditor.PROGRAM_TYPE_CHOICE).on('click', () => this.checkForTypeChange('program'));
        $(ModelEditor.USER_TYPE_CHOICE).on('click', () => this.checkForTypeChange('user'));
        $(ModelEditor.END_TYPE_CHOICE).on('click', () => this.checkForTypeChange('end'));
        $(ModelEditor.MODEL_DELETE_BUTTON).on('click', this.onDeleteModelButton.bind(this));
    }

    checkForTypeChange(newType) {
        // if there are no effects of a program model than save it
        if (!this.hasEffects()) {
            this.currentModel.usage = newType;
            return;
        }

        this.showConfirmPopup(i18n.t('modelEditor:effectsError'), () => {
            this.deleteEffects();
            this.currentModel.usage = newType;
            this.loadModel(this.currentTab);
        }, () => this.changeModelType(this.currentModel.usage));
    }

    changeModelType(usage = 'program') {
        $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', usage === 'program');
        $(ModelEditor.USER_TYPE_CHOICE).prop('checked', usage === 'user');
        $(ModelEditor.END_TYPE_CHOICE).prop('checked', usage === 'end');
    }

    /**
     * Buttons and input fields on node select
     */
    setupNodeConfiguration() {
        $(ModelEditor.CONFIG_NODE_LABEL).on('keyup change', () => {
            const text = $(ModelEditor.CONFIG_NODE_LABEL).val();

            const currentNodeID = this.network.getSelectedNodes()[0];
            for (const node of this.currentModel.nodes) {
                if (node.id === currentNodeID) {
                    node.label = text;
                    break;
                }
            }
            const selection = this.network.getSelection();
            this.loadModel(this.currentTab);
            this.network.setSelection(selection);
        });
        $(ModelEditor.CONFIG_NODE_STOP_ALL).on('click', () => {
            const node = this.network.getSelectedNodes()[0];
            if (this.edges.some(e => e.from === node)) {
                $(ModelEditor.CONFIG_NODE_STOP_ALL).prop('checked', false);
                this.showPopup(i18n.t('modelEditor:errStopAllNode'));
                return;
            }
            if ($(ModelEditor.CONFIG_NODE_STOP_ALL).prop('checked')) {
                this.currentModel.stopAllNodeIds.push(node);
            } else {
                const index = this.currentModel.stopAllNodeIds.indexOf(node);
                this.currentModel.stopAllNodeIds.splice(index, 1);
            }

            this.loadModel(this.currentTab);
        });
    }

    /**
     * Buttons and input fields on edge select
     */
    setupEdgeConfiguration() {
        $(ModelEditor.CONFIG_EDGE_LABEL).on('keyup change', () => {
            const text = $(ModelEditor.CONFIG_EDGE_LABEL).val();

            const currentEdge = this.network.getSelectedEdges()[0];
            for (const edge of this.currentModel.edges) {
                if (edge.id === currentEdge) {
                    edge.label = text;
                    break;
                }
            }
            const selection = this.network.getSelection();
            this.loadModel(this.currentTab);
            this.network.setSelection(selection);
        });

        $(ModelEditor.CHECK_CHOOSER).on('change', () => {
            const value = $(ModelEditor.CHECK_CHOOSER).val();
            this.showEmptyArgsForCheckType(value);
            this.addExplanation(value);
        });
        $(ModelEditor.ADD_CONDITION).on('click', () => this.addConditionAction());
        $(ModelEditor.ADD_EFFECT).on('click', () => this.addEffectAction());
        $(ModelEditor.CHECK_BACK).on('click', () => {
            $(ModelEditor.CHECK_DIV).addClass('hide');
            $(ModelEditor.CONFIG_EDGE).removeClass('hide');
        });

        $(ModelEditor.CHECK_SAVE).on('click', () => {
            const res = this.saveCheck();
            if (res.status) {
                const selection = this.network.getSelection();
                this.loadModel(this.currentTab);
                this.network.setSelection(selection);
                this.showEdgeOptions(this.network.getSelectedEdges()[0]);
            } else {
                this.showPopup(`${i18n.t('modelEditor:notValid')}<br>${res.message}`);
            }
        });
        $(ModelEditor.FORCE_TEST_AT).on('keyup change', () => {
            const field = $(ModelEditor.FORCE_TEST_AT);
            const value = field.val();
            if (value.match(ModelEditor.TIME_PATTERN) === null) {
                field.addClass(ModelEditor.INVALID_INPUT_CLASS);
            } else {
                field.removeClass(ModelEditor.INVALID_INPUT_CLASS);

                const edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
                edge.forceTestAt = parseInt(value, 10);
            }
        });
        $(ModelEditor.FORCE_TEST_AFTER).on('keyup change', () => {
            const field = $(ModelEditor.FORCE_TEST_AFTER);
            const value = field.val();
            if (value.match(ModelEditor.TIME_PATTERN) === null) {
                field.addClass(ModelEditor.INVALID_INPUT_CLASS);
            } else {
                field.removeClass(ModelEditor.INVALID_INPUT_CLASS);

                const edge = this.getEdgeById(this.network.getSelectedEdges()[0]);
                edge.forceTestAfter = parseInt(value, 10);
            }
        });
    }

    addConditionAction() {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:newCondition'));
        $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:newCondition');
        $(ModelEditor.CHECK_CHOOSER).children()
            .remove();
        $(ModelEditor.CHECK_NEGATED).prop('checked', false);

        const checkNames = Object.keys(checkLabelCodes).sort((a, b) => (a < b ? -1 : 0));
        checkNames.forEach(name => {
            const key = `modelEditor:${name}`;
            $(ModelEditor.CHECK_CHOOSER).append($('<option/>', {'value': name, 'data-i18n': key}).text(i18n.t(key)));
        });

        $(ModelEditor.CHECK_CHOOSER).val('AttrChange');
        this.showEmptyArgsForCheckType('AttrChange');
        this.checkIndex = -1;
        this.chosenList = 'condition';
        this.addExplanation('AttrChange');
    }

    addEffectAction() {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        if (this.currentModel.usage === 'user') {
            $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:newUserInput');
            $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:newUserInput'));
        } else {
            $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:newEffect');
            $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:newEffect'));
        }
        $(ModelEditor.CHECK_CHOOSER).children()
            .remove();
        $(ModelEditor.CHECK_NEGATED).prop('checked', false);

        let checkNames;
        let defValue;
        if (this.currentModel.usage === 'user') {
            defValue = 'InputClickSprite';
            checkNames = Object.keys(inputLabelCodes).sort((a, b) => (a < b ? -1 : 0));
            $(ModelEditor.CHECK_NEGATED_DIV).addClass('hide');
        } else {
            defValue = 'AttrChange';
            checkNames = Object.keys(checkLabelCodes).sort((a, b) => (a < b ? -1 : 0));
            $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
            this.addExplanation('AttrChange');
        }

        checkNames.forEach(name => {
            const key = `modelEditor:${name}`;
            $(ModelEditor.CHECK_CHOOSER).append($('<option/>', {'value': name, 'data-i18n': key}).text(i18n.t(key)));
        });

        $(ModelEditor.CHECK_CHOOSER).val(defValue);
        this.showEmptyArgsForCheckType(defValue);
        this.chosenList = 'effect';
        this.checkIndex = -1;
    }

    hideAddButtons() {
        $(ModelEditor.ADD_BUTTONS_DIV).addClass('hide');
        $(ModelEditor.CANCEL_ADD_DIV).removeClass('hide');
        $(ModelEditor.DELETE_DIV).addClass('hide');
    }

    showAddButtons() {
        $(ModelEditor.ADD_BUTTONS_DIV).removeClass('hide');
        $(ModelEditor.CANCEL_ADD_DIV).addClass('hide');
        $(ModelEditor.DELETE_DIV).addClass('hide');
    }

    showDeleteButton() {
        $(ModelEditor.ADD_BUTTONS_DIV).addClass('hide');
        $(ModelEditor.CANCEL_ADD_DIV).addClass('hide');
        $(ModelEditor.DELETE_DIV).removeClass('hide');
    }

    /**
     * Change the view to a model based on a clicked tab.
     * @param tabNr Number of the tab
     */
    changeToTab(tabNr) {
        this.loadModel(parseInt(tabNr, 10));

        const children = $(ModelEditor.TABS).children();
        let oldAttr = children[tabNr].getAttribute('class');
        const isActive = oldAttr.indexOf('active');
        if (isActive !== -1) {
            oldAttr = oldAttr.substring(0, isActive) + oldAttr.substring(isActive + 6, oldAttr.length);
        }
        for (const item of children) {
            item.setAttribute('class', oldAttr);
        }
        children[tabNr].setAttribute('class', `${oldAttr} active`);
        $(ModelEditor.TABS).scrollTop(children[tabNr].offsetTop);
        this.showGeneralSettings(tabNr);
    }

    /**
     * Create tabs based on the models loaded.
     */
    createAllTabs() {
        // clear tabs
        $(ModelEditor.TABS).children()
            .remove();

        if (!this.models.length || this.models.length === 0) {
            this.insertNewGraph();
        }

        for (const [i, model] of this.models.entries()) {
            this.addTab(model.id, i);
        }
    }

    /**
     * Add a new tab to the editor with the model having the given name.
     */
    addTab(name, nbr) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('class', 'tab-model-editor-button');
        button.textContent = name;
        button.setAttribute('value', nbr);

        button.onclick = () => {
            this.changeToTab(button.value);
        };
        $(ModelEditor.TABS).append(button);
    }

    /**
     * Load the models from the editor into the modelTester and change to the last active tab (as the order of
     * models can switch based on model type).
     */
    applyButton() {
        // get current active tab
        const lastFocus = $(ModelEditor.TABS).children('.active')[0].textContent;

        // load the models into the modelTester
        const json = JSON.stringify(this.models, null, 4);
        this.modelTester.load(json);
        $('#model-label').html('Loaded from model editor');

        // change to last active tab
        let lastIndex = 0;
        const newChildren = $(ModelEditor.TABS).children();
        for (const elem of newChildren) {
            if (elem.textContent === lastFocus) {
                lastIndex = elem.value;
                break;
            }
        }

        this.changeToTab(lastIndex);
    }

    /** Download the program and end models in the editor. */
    downloadProgramModels() {
        const json = JSON.stringify(this.models.filter(m => m.usage !== 'user'), null, 4);
        const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'progam-models.json');
    }

    /** Download the user models in the editor. */
    downloadUserModels() {
        const json = JSON.stringify(this.models.filter(m => m.usage === 'user'), null, 4);
        const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, 'user-models.json');
    }

    minimizeOracleModels() {
        const result = this.modelTester.minimizeOracleModels();
        const changed = result.filter(m => m.status);
        if (changed.length === 0) {
            this.showPopup(i18n.t('modelEditor:alreadyMinimized'));
            return;
        }
        const edges = i18n.t('modelEditor:edges');
        const nodes = i18n.t('modelEditor:nodes');
        const stopAllNodes = i18n.t('modelEditor:stopAllNodes');
        const toCell = v =>
            `<td style="border:1px solid black;padding:5px;text-align:center; vertical-align:middle;">${v}</td>`;
        const toHeadCell = v => `<th style="border:1px solid black;padding:5px;">${v}</th>`;
        const toRow = (values, mapper) => `<tr>${values.map(mapper).join('')}</tr>`;
        const changedInfo = changed
            .map(res => [res.minimized.id, res.removedEdges, res.removedNodes, res.removedStopAllNodes])
            .map(row => toRow(row, toCell));
        const msg = `${i18n.t('modelEditor:minimizationHeader')}<br><br>
<table style="border:1px solid black; border-collapse:collapse;">
    ${toRow(['id', edges, nodes, stopAllNodes], toHeadCell)}
    ${changedInfo}
</table>`;
        const updateModels = () => this.modelTester.loadProgramModels(JSON.stringify(result.map(r => r.minimized)));
        this.showConfirmPopup(msg, updateModels);
    }

    /**
     * When the id input field sends a keyup change event, check for duplicate model ids (if true add a number to
     * the id) and update the model.
     */
    onModelIDChange() {
        const newValue = $(ModelEditor.MODEL_ID_FIELD).val();

        // ignore all not changing buttons such as SHIFT
        if (newValue === $(ModelEditor.TABS).children('.active')[0].textContent) {
            return;
        }

        const hasThisId = this.models.filter(m => m.id === newValue).length;

        if (hasThisId > 0) {
            this.currentModel.id = newValue + hasThisId;
            setTimeout(() => {
                $(ModelEditor.MODEL_ID_FIELD).val(this.currentModel.id);
            }, 1000);
        } else {
            this.currentModel.id = newValue;
        }
        $(ModelEditor.TABS).children('.active')[0].textContent = this.currentModel.id;
    }

    /**
     * When the delete model button is clicked show a popup to confirm.
     */
    onDeleteModelButton() {
        this.showConfirmPopup(i18n.t('modelEditor:deletePromptMessage'),
            () => {
                this.deleteCurrentModel();
                this.removeCurrentTab();
            });
    }

    /**
     * Remove the currently active tab and move to the previous one
     */
    removeCurrentTab() {
        $(ModelEditor.TABS).children('.active')
            .remove();
        this.createAllTabs();
        this.changeToTab(this.currentTab === 0 ? 0 : this.currentTab - 1);
    }

    /**
     * Make an overlay over the model editor and show a confirm popup.
     * @param message Message of the popup
     */
    showPopup(message) {
        const dialog = $('<div/>', {class: 'popup'})
            .append(
                $('<p/>').html(message)
            )
            // CREATE THE BUTTONS
            .append(
                $('<div/>', {class: 'text-right'})
                    .append($('<button/>', {class: 'btn btn-main'}).html(i18n.t('modelEditor:okButton'))
                        .click(() => {
                            $('#model-editor-content').children('#model-popup')
                                .remove();
                        }))
            );

        // create overlay and popup over the model editor
        const overlay = $('<div/>', {class: 'overlay', id: 'model-popup'})
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
        const dialog = $('<div/>', {class: 'popup'})
            .append(
                $('<p/>').html(message)
            )
            // CREATE THE BUTTONS
            .append(
                $('<div/>', {class: 'text-right'})
                    .append($('<button/>', {class: 'btn btn-cancel'}).html(i18n.t('modelEditor:cancelButton'))
                        .click(() => {
                            if (callbackOnCancel) {
                                callbackOnCancel();
                            }
                            $('#model-editor-content').children('#model-confirm')
                                .remove();
                        })
                    )
                    .append($('<button/>', {class: 'btn btn-main'}).html(i18n.t('modelEditor:okButton'))
                        .click(() => {
                            if (callbackOnOk) {
                                callbackOnOk();
                            }
                            $('#model-editor-content').children('#model-confirm')
                                .remove();
                        }))
            );

        // create overlay and popup over the model editor
        const overlay = $('<div/>', {class: 'overlay', id: 'model-confirm'})
            .append(dialog);
        $('#model-editor-content').append(overlay);
    }

    /**
     * Setup the click events on nodes and edges.
     */
    setUpClickEvents() {
        // Control the buttons on select
        this.network.on('select', data => {
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
        });
        this.network.on('dragging', () => {
            this.showGeneralSettings(this.currentTab);
            this.network.unselectAll();
        });
    }

    showNodeOptions(nodeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass('hide');
        $(ModelEditor.CONFIG_NODE).removeClass('hide');
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).addClass('hide');

        // get the corresponding node
        const node = this.currentModel.nodes.find(n => n.id === nodeID);

        if (this.currentModel.stopAllNodeIds.includes(node.id)) {
            $(ModelEditor.CONFIG_NODE_STOP_ALL).prop('checked', true);
        } else {
            $(ModelEditor.CONFIG_NODE_STOP_ALL).prop('checked', false);
        }
        if (this.currentModel.startNodeId === node.id) {
            $(ModelEditor.CONFIG_NODE_STOP_ALL).attr('disabled', true);
        } else {
            $(ModelEditor.CONFIG_NODE_STOP_ALL).attr('disabled', false);
        }

        this.showPriorityChanger(nodeID, node);
    }

    /** to sort the edge priorities */
    showPriorityChanger(nodeID, node) {
        const outgoingEdges = this.currentModel.edges.filter(edge => edge.from === nodeID);

        const tag = 'model-priority-row';
        $(ModelEditor.PRIORITY_CHANGER).children(`.${tag}`)
            .remove();

        if (outgoingEdges.length <= 1) {
            $(ModelEditor.PRIORITY_CHANGER_DIV).addClass('hide');
        } else {
            $(ModelEditor.PRIORITY_CHANGER_DIV).removeClass('hide');

            const oldValues = [];
            for (let i = 0; i < outgoingEdges.length; i++) {
                const select = $('<select/>', {name: `model-priority${i}`, id: tag + i, style: 'width:100%;'});

                outgoingEdges.forEach(edge => {
                    select.append($('<option/>', {value: edge.id}).text(edge.label));
                });
                select.val(outgoingEdges[i].id);
                oldValues.push(outgoingEdges[i].id);

                select.change(() => {
                    this.setPriority(node, oldValues[i], select.val(), oldValues);
                });

                $(ModelEditor.PRIORITY_CHANGER).append(
                    $('<div/>', {class: `row mt-1 ${tag}`}).append(
                        $('<div/>', {class: 'col-2'}).append($('<label/>').html(`<b>${i + 1}.</b>`))
                    )
                        .append(
                            $('<div/>', {class: 'col'}).append(select)
                        ));
            }
        }
    }

    /** set the edge with edgeID of node to the new position */
    setPriority(node, oldEdgeId, edgeID) {
        let firstIndex = -1;
        let secondIndex = -1;

        for (const [i, edge] of this.currentModel.edges.entries()) {
            if (edge.id === oldEdgeId) {
                firstIndex = i;
            } else if (edge.id === edgeID) {
                secondIndex = i;
            }
        }
        const temp = this.currentModel.edges[firstIndex];
        this.currentModel.edges[firstIndex] = this.currentModel.edges[secondIndex];
        this.currentModel.edges[secondIndex] = temp;

        const selection = this.network.getSelectedNodes();
        this.loadModel(this.currentTab);
        this.network.selectNodes(selection);
        this.showNodeOptions(node.id);
    }

    showEdgeOptions(edgeID) {
        $(ModelEditor.GENERAL_SETTINGS_DIV).addClass('hide');
        $(ModelEditor.CONFIG_NODE).addClass('hide');
        $(ModelEditor.CONFIG_EDGE).removeClass('hide');
        $(ModelEditor.CHECK_DIV).addClass('hide');

        // get the corresponding edge
        const edge = this.getEdgeById(edgeID);

        $(ModelEditor.CONFIG_EDGE_LABEL).val(edge.label);
        // clear the conditions and effects
        $(ModelEditor.CONDITIONS).children()
            .remove();
        $(ModelEditor.EFFECTS).children()
            .remove();

        const isAUserModel = this.currentModel.usage === 'user';
        const effectInputLabel = $(ModelEditor.EFFECT_OR_INPUT_LABEL);
        if (isAUserModel) {
            effectInputLabel.attr('data-original-title', i18n.t('modelEditor:t-userInputs'));
            effectInputLabel.text(i18n.t('modelEditor:userInputs'));
        } else {
            effectInputLabel.attr('data-original-title', i18n.t('modelEditor:t-effects'));
            effectInputLabel.text(i18n.t('modelEditor:effects'));
        }
        if (edge.conditions.length > 0) {
            $(ModelEditor.CONDITIONS).append(this.getCheckElement(edge.conditions[0], 0));
            for (let i = 1; i < edge.conditions.length; i++) {
                $(ModelEditor.CONDITIONS).append($('<hr/>', {class: 'model-check-line'}))
                    .append(this.getCheckElement(edge.conditions[i], i, isAUserModel));
            }
        }

        // fill up effects of current edge
        if (edge.effects.length > 0) {
            $(ModelEditor.EFFECTS).append(this.getCheckElement(edge.effects[0], 0, true, isAUserModel));
            for (let i = 1; i < edge.effects.length; i++) {
                $(ModelEditor.EFFECTS).append($('<hr/>', {class: 'model-check-line'}))
                    .append(this.getCheckElement(edge.effects[i], i, true, isAUserModel));
            }
        }

        // force timers
        if (edge.forceTestAfter && edge.forceTestAfter !== -1) {
            $(ModelEditor.FORCE_TEST_AFTER).val(edge.forceTestAfter);
        } else {
            $(ModelEditor.FORCE_TEST_AFTER).val('');
        }
        if (edge.forceTestAt && edge.forceTestAt !== -1) {
            $(ModelEditor.FORCE_TEST_AT).val(edge.forceTestAt);
        } else {
            $(ModelEditor.FORCE_TEST_AT).val('');
        }
    }

    showCheckOptions(check, isAnEffect = false, isAUserModel = false) {
        $(ModelEditor.CONFIG_EDGE).addClass('hide');
        $(ModelEditor.CHECK_DIV).removeClass('hide');
        let checkNames;

        if (!isAnEffect) {
            $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:condition');
            $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:condition'));
            $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
            checkNames = Object.keys(checkLabelCodes).sort((a, b) => (a < b ? -1 : 0));
        } else if (isAnEffect) {
            if (isAUserModel) {
                $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:userInput');
                $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:userInput'));
                $(ModelEditor.CHECK_NEGATED_DIV).addClass('hide');
                checkNames = Object.keys(inputLabelCodes).sort((a, b) => (a < b ? -1 : 0));
            } else {
                $(ModelEditor.CHECK_LABEL).attr('data-i18n', 'modelEditor:effect');
                $(ModelEditor.CHECK_LABEL).text(i18n.t('modelEditor:effect'));
                $(ModelEditor.CHECK_NEGATED_DIV).removeClass('hide');
                checkNames = Object.keys(checkLabelCodes).sort((a, b) => (a < b ? -1 : 0));
            }
        }

        const chooser = $(ModelEditor.CHECK_CHOOSER);
        chooser.children().remove();
        checkNames.forEach(name => {
            const key = `modelEditor:${name}`;
            chooser.append($('<option/>', {'value': name, 'data-i18n': key}).text(i18n.t(key)));
        });

        $(ModelEditor.CHECK_NEGATED).prop('checked', check.negated);
        $(ModelEditor.CHECK_CHOOSER).val(check.name);
        this.changeCheckType(isAnEffect, isAUserModel, check.name, check.args);

        this.addExplanation(check.name);
    }

    addExplanation(type) {
        $(ModelEditor.CHECK_EXPLANATION).children()
            .remove();
        const argTypes = checkLabelCodes[type] ?? inputLabelCodes[type];
        const children = [];
        for (let i = 0; i < argTypes.length; i++) {
            const key = `modelEditor:${argTypes[i]}Hint`;
            const hint = i18n.t(key);
            if (hint !== `${argTypes[i]}Hint`) {
                children.push($('<label/>', {'style': 'ml-1', 'data-i18n': key}).text(hint));
            }
        }

        if (children.length > 0) {
            $(ModelEditor.CHECK_EXPLANATION).append($('<label/>', {'data-i18n': 'modelEditor:hintTitle'})
                .text(i18n.t('modelEditor:hintTitle')));
            for (const item of children) {
                $(ModelEditor.CHECK_EXPLANATION).append(item);
            }
        }
    }

    /**
     * Show argument inputs for a new check of a type.
     */
    showEmptyArgsForCheckType(type) {
        $(ModelEditor.CHECK_ARGS_DIV).children()
            .remove();

        const argNames = checkLabelCodes[type] ?? inputLabelCodes[type];
        for (const [i, argName] of argNames.entries()) {
            this.appendInputBasedOnType(argName, placeholders[argName], i);
        }
    }

    /**
     * Show check argument inputs for the chosen type.
     * @param isAnEffect Flag if the check is an effect
     * @param isAUserModel Flag if the check is part of a UserModel
     * @param type Type of check, has to be of checkLabelCodes
     * @param args Arguments of the check
     */
    changeCheckType(isAnEffect, isAUserModel, type, args) {
        const codes = isAnEffect && isAUserModel ? inputLabelCodes : checkLabelCodes;
        const argNames = codes[type];

        if (args.length !== argNames.length) {
            logger.error(`Loaded model has a check with wrong number of arguments`);
        }
        $(ModelEditor.CHECK_ARGS_DIV).children()
            .remove();

        for (const [i, argName] of argNames.entries()) {
            this.appendInputBasedOnType(argName, args[i], i);
        }
    }

    appendInputBasedOnType(type, value, i) {
        switch (type) {
        case argType.spriteName:
            this.appendInputWithPattern('modelEditor:spriteName', value,
                ModelEditor.NOT_EMPTY_PATTERN, i, null, null, i18n.t('modelEditor:spriteName'));
            break;
        case argType.varName:
            this.appendInputWithPattern('modelEditor:varName', value,
                ModelEditor.NOT_EMPTY_PATTERN, i, null, null, i18n.t('modelEditor:spriteName'));
            break;
        case argType.attrName:
            this.appendAttributeNames(value, i);
            break;
        case argType.costumeName:
            this.appendInputWithPattern('modelEditor:costumeName', value,
                ModelEditor.NOT_EMPTY_PATTERN, i);
            break;
        case argType.value:
            this.appendInputWithPattern('modelEditor:value', value,
                ModelEditor.NOT_EMPTY_PATTERN, i);
            break;
        case argType.change:
            this.appendInputWithPattern('modelEditor:change', value, ModelEditor.CHANGE_PATTERN, i);
            break;
        case argType.comp:
            this.appendComparisonSelection(value, i);
            break;
        case argType.probValue:
            this.appendInputWithPattern('modelEditor:prob', value * 100,
                ModelEditor.PROB_PATTERN, i, 'max-width:60px; position:absolute; right:5px', '%');
            break;
        case argType.time:
            this.appendInputWithPattern('modelEditor:time', value, ModelEditor.TIME_PATTERN,
                i, 'max-width:60px;position:absolute; right:5px', 'ms');
            break;
        case argType.keyName:
            this.appendKeys(value, i);
            break;
        case argType.bool:
            this.appendBool(value, i);
            break;
        case argType.r:
            this.appendInputWithPattern('modelEditor:rValue', value, ModelEditor.RGB_PATTERN,
                i, 'max-width:60px;');
            break;
        case argType.g:
            this.appendInputWithPattern('modelEditor:gValue', value, ModelEditor.RGB_PATTERN,
                i, 'max-width:60px;');
            break;
        case argType.b:
            this.appendInputWithPattern('modelEditor:bValue', value, ModelEditor.RGB_PATTERN,
                i, 'max-width:60px;');
            break;
        case argType.coordX:
            this.appendInputWithPattern('modelEditor:xCoord', value, ModelEditor.X_PATTERN,
                i, 'max-width:60px;');
            break;
        case argType.coordY:
            this.appendInputWithPattern('modelEditor:yCoord', value, ModelEditor.Y_PATTERN,
                i, 'max-width:60px;');
            break;
        case argType.expr:
            this.appendAreaInput('modelEditor:expr', value, 'expression ...', i);
            break;
        case argType.layerSelection:
            this.appendInputWithPattern('modelEditor:layerSelection', value, ModelEditor.LAYER_PATTERN,
                i, 'max-width:60px;');
            break;
        default:
            logger.err(`There is a pattern missing: ${type}`);
        }
    }

    appendAreaInput(key, value, placeholder, idNbr) {
        const textarea = $('<textarea/>', {
            class: 'col mr-2',
            style: 'overflow:auto;',
            rows: 6,
            id: ModelEditor.INPUT_ID + idNbr,
            placeholder: placeholder
        }).val(value)
            .on('keyup change', () => {
                if (textarea.val().trim().length === 0 && key === 'modelEditor:expr') {
                    textarea.addClass(ModelEditor.INVALID_INPUT_CLASS);
                } else {
                    textarea.removeClass(ModelEditor.INVALID_INPUT_CLASS);
                }
            });
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col mt-1'}).append($('<label/>', {'data-i18n': key}).text(i18n.t(key)))
        ))
            .append($('<div/>', {class: 'row'}).append(textarea));
    }

    appendInputWithPattern(key, value, pattern, idNbr, style = null, unit = null, placeholder = null) {
        const id = ModelEditor.INPUT_ID + idNbr;
        const row = $('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col-4 mt-1'}).append($('<label/>', {'data-i18n': key}).text(i18n.t(key)))
        )
            .append(
                $('<div/>', {class: 'col'}).append($('<input/>', {
                    id: id,
                    class: 'fill-parent',
                    style: style,
                    placeholder: placeholder
                })
                    .val(value)
                    .on('keyup change', () => {
                        const queryID = `#${id}`;
                        if ($(queryID).val()
                            .match(pattern) === null) {
                            $(queryID).addClass(ModelEditor.INVALID_INPUT_CLASS);
                        } else {
                            $(queryID).removeClass(ModelEditor.INVALID_INPUT_CLASS);
                        }
                    })
                ));

        if (unit) {
            row.append($('<div/>', {
                class: 'col-1 mt-1 mr-1',
                style: 'padding-left:0;'
            }).append($('<label/>').text(unit)));
        }
        $(ModelEditor.CHECK_ARGS_DIV).append(row);
    }

    appendComparisonSelection(value, idNbr) {
        const id = ModelEditor.INPUT_ID + idNbr;
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col-4 mt-1'}).append($('<label/>', {'data-i18n': 'modelEditor:comp'})
                .text(i18n.t('modelEditor:comp')))
        )
            .append(
                $('<div/>', {class: 'col mt-1', style: 'float:left;'}).append(
                    $('<select/>', {name: `selectChange${idNbr}`, id: id})
                        .append($('<option/>', {value: '=='}).text('=='))
                        .append($('<option/>', {value: '!='}).text('!='))
                        .append($('<option/>', {value: '>'}).text('>'))
                        .append($('<option/>', {value: '<'}).text('<'))
                        .append($('<option/>', {value: '>='}).text('>='))
                        .append($('<option/>', {value: '<='}).text('<='))
                        .val('==')
                )
            ));
    }

    appendKeys(value, idNbr) {
        const id = ModelEditor.INPUT_ID + idNbr;
        const select = $('<select/>', {name: `selectKey${idNbr}`, id: id});
        for (let i = 0; i < keys.length; i++) {
            const key = `modelEditor:${keys[i]}`;
            select.append($('<option/>', {'value': keys[i], 'data-i18n': key}).text(i18n.t(key)));
        }
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col-4 mt-1'}).append($('<label/>', {'data-i18n': 'modelEditor:key'})
                .text(i18n.t('modelEditor:key')))
        )
            .append($('<div/>', {class: 'col mt-1', style: 'float:left;'}).append(select)));
        select.val(value);
    }

    appendAttributeNames(value, idNbr) {
        const id = ModelEditor.INPUT_ID + idNbr;
        const select = $('<select/>', {name: `selectAttrName${idNbr}`, id: id});
        for (const attrName of attributeAndEffectNames) {
            const i18nKey = `modelEditor:${attrName}`;
            select.append($('<option/>', {'value': attrName, 'data-i18n': i18nKey}).text(i18n.t(i18nKey)));
        }
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col-4 mt-1'}).append($('<label/>', {'data-i18n': 'modelEditor:attrName'})
                .text(i18n.t('modelEditor:attrName')))
        )
            .append($('<div/>', {class: 'col mt-1', style: 'float:left;'}).append(select)));
        select.val(attributeAndEffectNames[0]);
    }

    appendBool(value, idNbr) {
        const id = ModelEditor.INPUT_ID + idNbr;
        $(ModelEditor.CHECK_ARGS_DIV).append($('<div/>', {class: 'row'}).append(
            $('<div/>', {class: 'col-4 mt-1'}).append($('<label/>', {'data-i18n': 'modelEditor:bool'})
                .text(i18n.t('modelEditor:bool')))
        )
            .append(
                $('<div/>', {class: 'col mt-1', style: 'float:left;'}).append(
                    $('<select/>', {name: `selectBool${idNbr}`, id: id})
                        .append($('<option/>', {'value': 'true', 'data-i18n': 'modelEditor:true'})
                            .text(i18n.t('modelEditor:true')))
                        .append($('<option/>', {
                            'value': 'false',
                            'data-i18n': 'modelEditor:false'
                        }).text(i18n.t('modelEditor:false')))
                        .val(value)
                )
            ));
    }

    /** Append a row element that shows a condition or effect and its arguments.     */
    getCheckElement(check, index, isAnEffect = false, isAUserModel = false) {
        const key = `modelEditor:${check.name}`;
        const name = checkToString(check, s => i18n.t(`modelEditor:${s}`), 40);

        return $('<div/>', {class: 'row', style: 'margin:0;'})
            .append($('<div/>', {class: 'col model-check'}).append($('<label/>',
                {'class': 'model-check', 'data-i18n': key})
                .text(name))
                .click(() => {
                    this.checkIndex = index;
                    this.chosenList = isAnEffect ? 'effect' : 'condition';
                    this.showCheckOptions(check, isAnEffect, isAUserModel);
                }))
            .append($('<button/>', {
                'class': 'model-button check-delete', 'type': 'button', 'data-i18n': 'modelEditor:delModel'
            })
                .text(i18n.t('modelEditor:delModel'))
                .click(() => {
                    this.removeCheck(check);
                    const selection = this.network.getSelectedEdges()[0];
                    this.loadModel(this.currentTab);
                    this.network.selectEdges([selection]);
                    this.showEdgeOptions(selection);
                }));
    }

    /** for fixing model position after loading the element */
    reposition() {
        this.network.fit();
    }
}

module.exports = ModelEditor;
