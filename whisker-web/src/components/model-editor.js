const {ModelTester} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const {i18n} = require("../index");

class ModelEditor {

    static ID_FIELD = "#editor-id";
    static LABEL_FIELD = '#editor-label';
    static OP_NAME_FIELD = '#model-editor-operation';
    static MODEL_ID_FIELD = '#model-id';
    static PROGRAM_TYPE_CHOICE = '#model-type-program';
    static USER_TYPE_CHOICE = '#model-type-user';
    static SAVE_GENERAL_SETTINGS = '#model-general-save';

    /**
     * @param {ModelTester} modelTester
     */
    constructor(modelTester) {
        this.modelTester = modelTester;
        this.currentTab = 0;
        this.container = document.getElementById("model-editor-canvas");
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
                enabled: true,
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
        this.data = {nodes: [], edges: []};
        this.modelTester.on(ModelTester.ModelTester.MODEL_ON_LOAD, this.loadModel.bind(this));
        this.network = new vis.Network(this.container, this.data, this.options);
        document.getElementsByClassName('vis-network')[0].style['overflow'] = 'visible';
        this.network.enableEditMode();
        // this.setUpButtons();
    }

    drawModelEditor() {
        this.network.redraw();

        // todo why is the graph moved to the upper left corner?!
        // console.log(this.network.getViewPosition())
        // let options = {
        //     // position: {x: 100, y: 100},
        //     offset: {x: 0, y: 0},
        //     duration: 0,
        //     easingFunction: 'easeInOutQuad'
        // };
        // this.network.focus("init")
        // // this.network.redraw();
        // console.log(this.network.getViewPosition())
        // // this.network.moveTo( {position:{x:0,y:0}})
        // this.network.fit();

        // set css attributes here as css file is ignored by framework redraw
        document.getElementsByClassName('vis-network')[0].style['overflow'] = 'visible';
        document.getElementsByClassName('vis-close')[0].value = "Löschen";
    }

    // todo on click on a model tab
    loadModel(tabNbr = 0) {
        this.currentTab = tabNbr;
        this.models = this.modelTester.getAllModels();

        if (this.models.length === 0) {
            this.nodes = [];
            this.edges = [];
        } else {
            if (tabNbr >= this.models.length) {
                throw Error("Tab number higher than number of models.");
            }
            this.nodes = this.setupNodes(this.models[tabNbr]);
            this.edges = this.setupEdges(this.models[tabNbr].edges, this.nodes);
            console.log(this.models[tabNbr].id);
            $('#model-editor-first-tab').html(this.models[tabNbr].id);
        }

        // todo create tabs for each model (scrollable?)

        this.data = {nodes: this.nodes, edges: this.edges};
        this.network.setData(this.data);
        console.log(this.data);
        this.drawModelEditor();
        this.showGeneralSettings(tabNbr);
    }

    // todo show when making new tab on new graph
    showGeneralSettings(tabNbr) {
        document.getElementById('model-general-settings').style.display = 'block';
        document.getElementById('model-editor-configuration').style.display = 'none';

        if (this.models != undefined) {
            // load into the header etc
            $(ModelEditor.MODEL_ID_FIELD).val(this.models[tabNbr].id);
            console.log(this.models[tabNbr])

            if (this.models[tabNbr].usage === "program" || this.models[tabNbr].usage === undefined) {
                $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked',true);
                $(ModelEditor.USER_TYPE_CHOICE).prop('checked',false);
            } else {
                $(ModelEditor.PROGRAM_TYPE_CHOICE).prop('checked',false);
                $(ModelEditor.USER_TYPE_CHOICE).prop('checked',true);
            }
        }
    }

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

    setUpButtons() {
        this.network.on('selectNode', this.network.editNode); // todo needed?
        this.network.on('deselectNode', () => {
            $('#model-editor-operation').text(i18n.t(""));
            $('#editor-id').val("");
            $('#editor-label').val("");
        });
        $('#model-editor-save').on('click', () => {
            let json = JSON.stringify(this.modelTester.getAllModels(), null, 4);
            const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
            FileSaver.saveAs(blob, 'models.json');
        })

        // todo this listener is not yet reacting.... why?!
        document.getElementById(ModelEditor.SAVE_GENERAL_SETTINGS).onclick = () => {
            // todo id

            console.log(this.models[this.currentTab]);
            if ($(ModelEditor.PROGRAM_TYPE_CHOICE).checked) {
                this.models[this.currentTab].usage = "program";
            } else {
                this.models[this.currentTab].usage = "user";
            }
            console.log(this.models[this.currentTab]);
        }
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

}

module.exports = ModelEditor;
