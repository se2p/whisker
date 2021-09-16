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

    // below the model editor
    static SAVE_BUTTON = '#model-editor-save';
    static APPLY_BUTTON = '#model-editor-apply';

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
                    iterations: 1200,
                },
            },
            manipulation: {
                enabled: true
                // addNode: addNode,
                // editNode: editNode,
                // addEdge: addEdge
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
        this.network.enableEditMode();
        this.setUpButtons();
        this.addTab(i18n.t('modelEditor:tabContent') + "1", "1");
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
        $(ModelEditor.OP_NAME_FIELD).text(i18n.t("model-editor:addNode"));
        $(ModelEditor.ID_FIELD).val(data.id);
        $(ModelEditor.LABEL_FIELD).val(data.label);
        document.getElementById("saveButton").onclick = this.saveData;
        // document.getElementById("cancelButton").onclick = clearPopUp.bind();
    }

    editNode(data, callback) {
        $(ModelEditor.OP_NAME_FIELD).text(i18n.t("model-editor:editNode"));
        $(ModelEditor.ID_FIELD).val(data.x);
        $(ModelEditor.LABEL_FIELD).val(data.label);

        document.getElementById("saveButton").onclick = this.saveData;
        // document.getElementById("cancelButton").onclick = cancelEdit.bind(this, callback);
    }

    saveData(data, callback) {
        data.id = $(ModelEditor.ID_FIELD).val();
        data.label = $(ModelEditor.LABEL_FIELD).val();
        callback(data);
    }

    addEdge(data, callback) {
        if (data.from === data.to) {
            let r = confirm("Do you want to connect the node to itself?");
            if (r === true) {
                callback(data);
            }
        } else {
            callback(data);
        }
    }

    // ############################# Actual data manipulation ######################

    insertNewGraph() {
        let id = i18n.t("modelEditor:tabContent") + (this.models.length + 1);
        this.models.push({
            id: id,
            usage: 'program',
            startNodeId: 'start',
            nodeIds: ['start'],
            stopNodeIds: [],
            stopAllNodeIds: [],
            edges: []
        })
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

    // todo on click on a model tab
    loadModel(tabNbr = 0) {
        this.currentTab = tabNbr;

        if (this.models.length === 0) {
            this.nodes = [];
            this.edges = [];
        } else {
            if (tabNbr >= this.models.length) {
                throw Error("Tab number higher than number of models.");
            }
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
        } else {
            $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked', false);
            $(ModelEditor.USER_TYPE_CHOICE).prop('checked', true);
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
        let nodes = [];
        let nodeIds = json.nodeIds;
        for (const nodeId in nodeIds) {
            let label = nodeIds[nodeId];
            let node = {id: label, label: label};
            if (label === json.startNodeId) {
                node.color = "rgb(0,151,163)";
                node.title = "Start";
            }
            nodes.push(node);
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
                    edge.selfReference = {angle: i * 10};
                    if (loops[nodeId].length > 2) {
                        edge.selfReference.size = 15;
                    }
                    i += 1;
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
        // apply
        $(ModelEditor.APPLY_BUTTON).on('click', () => {
            let json = JSON.stringify(this.models, null, 4);
            this.modelTester.load(json);
            $('#model-label').html('Loaded from model editor');
            // $('#modelfile') todo maybe delete the fileselects content with clear
        })

        // download
        $(ModelEditor.SAVE_BUTTON).on('click', () => {
            let json = JSON.stringify(this.modelTester.getAllModels(), null, 4);
            const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
            FileSaver.saveAs(blob, 'models.json');
        });

        // tab behaviour
        $(ModelEditor.ADD_TAB).on('click', () => {
            this.insertNewGraph();
            this.addTab(i18n.t("modelEditor:tabContent") + this.models.length, this.models.length - 1);
            this.changeToTab(this.models.length - 1);
        })

        // General settings of model
        $(ModelEditor.MODEL_ID_FIELD).on('keyup change', () => {
            this.models[this.currentTab].id = $(ModelEditor.MODEL_ID_FIELD).value;
        })
        $(ModelEditor.PROGRAM_TYPE_CHOICE).on('click', () => {
            this.models[this.currentTab].usage = "program";
        })
        $(ModelEditor.USER_TYPE_CHOICE).on('click', () => {
            this.models[this.currentTab].usage = "user";
        })
    }

    // todo dont allow two identical model ids

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

    // editNode(data, cancelAction, callback) {
    //     $("model-node-label").value = data.label;
    //     $("model-node-saveButton").onclick = this.saveNodeData.bind(
    //         this,
    //         data,
    //         callback
    //     );
    //     $("model-node-cancelButton").onclick = cancelAction.bind(
    //         this,
    //         callback
    //     );
    // }

// Callback passed as parameter is ignored
//     clearNodePopUp() {
//         $("model-node-saveButton").onclick = null;
//         $("model-node-cancelButton").onclick = null;
//     }

    // cancelNodeEdit(callback) {
    //     this.clearNodePopUp();
    //     callback(null);
    // }

    // saveNodeData(data, callback) {
    //     data.label = $("model-node-label").value;
    //     this.clearNodePopUp();
    //     callback(data);
    // }

    // editEdgeWithoutDrag(data, callback) {
    //     // filling in the popup DOM elements
    //     $("model-edge-label").value = data.label;
    //     $("model-edge-saveButton").onclick = this.saveEdgeData.bind(this, data, callback);
    //     $("model-edge-cancelButton").onclick = this.cancelEdgeEdit.bind(this, callback);
    //     $("model-edge-popUp").style.display = "block";
    // }

    // clearEdgePopUp() {
    //     $("model-edge-saveButton").onclick = null;
    //     $("model-edge-cancelButton").onclick = null;
    //     $("model-edge-popUp").style.display = "none";
    // }

    // cancelEdgeEdit(callback) {
    //     this.clearEdgePopUp();
    //     callback(null);
    // }
    //
    // saveEdgeData(data, callback) {
    //     if (typeof data.to === "object") data.to = data.to.id;
    //     if (typeof data.from === "object") data.from = data.from.id;
    //     data.label = $("model-edge-label").value;
    //     this.clearEdgePopUp();
    //     callback(data);
    // }

    // for fixing model position after loading the element
    reposition() {
        this.network.fit();
    }
}

module.exports = ModelEditor;
