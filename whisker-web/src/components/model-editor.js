const {ModelTester} = require('whisker-main');
const {$, FileSaver} = require('../web-libs');
const vis = require('vis-network');
const {i18n} = require("../index");

class ModelEditor {

    static ID_FIELD = "#editor-id";
    static LABEL_FIELD = '#editor-label';
    static OP_NAME_FIELD = '#model-editor-operation';

    /**
     * @param {ModelTester} modelTester
     */
    constructor(modelTester) {
        this.modelTester = modelTester;
        this.network = null;
        this.data = null;
        this.container = document.getElementById("model-editor-canvas");
        this.nodes = [];
        this.edges = [];

        // {id: 1, label: "Start", color: "rgb(0,151,163)", title: "test"},
        this.dummyNodes = [];
        // from, to,  font: {align: "top"},
        //                 condition: "Function:true",
        //                 effect: "VarComp:Stage:Zeit:=:30,VarComp:Stage:Punkte:=:0,AttrComp:Bowl:x:=:0,AttrComp:Bowl:y:=:-145",
        //                 color: "#000000",
        //                 arrows: {
        //                     to: {
        //                         enabled: true,
        //                         type: "triangle",
        //                     },
        //                 },
        this.dummyEdges = [];

        const addNode = this.addNode;
        const editNode = this.editNode;
        const addEdge = this.addEdge;

        this.options = {
            edges: {
                smooth: true,
                physics: true,
                arrows: {from: {enabled: false}, to: {enabled: true}}
            },
            layout: {
                improvedLayout: true,
            },
            physics: {
                stabilization: true
            },
            manipulation: {
                enabled: true,
                initiallyActive: true,
                addNode: addNode,
                editNode: editNode,
                addEdge: addEdge
                // todo edit edge?
            },
            locale: $('#lang-select').val(),
            clickToUse: false,
            // width: '700px',
            height: '420px',

            // configure: {
            //     container: document.getElementById('model-editor-configuration')
            // }
            autoResize: true
        };
        this.data = {nodes: this.dummyNodes, edges: this.dummyEdges};
        this.drawModelEditor();
        this.setUpButtons();

        this.modelTester.on(ModelTester.ModelTester.MODEL_ON_LOAD, this.loadModel.bind(this));
        $('#model-editor-save').on('click', () => {
            let json = JSON.stringify(this.modelTester.getAllModels(), null, 4);
            const blob = new Blob([json], {type: 'text/plain;charset=utf-8'});
            FileSaver.saveAs(blob, 'models.json');
        })
    }

    // todo get new nodes and edges based on the loaded models
    // todo make a new view for each model -> multiple networks

    drawModelEditor() {
        // todo look up how to destroy the old one correctly as in the examples
        this.network = new vis.Network(this.container, this.data, this.options);
        this.network.enableEditMode();
        this.network.on('selectNode', this.network.editNode);
        this.network.on('deselectNode', () => {
            $('#model-editor-operation').text(i18n.t(""));
            $('#editor-id').val("");
            $('#editor-label').val("");
        });
        document.getElementsByClassName('vis-network')[0].style['overflow']='visible';
        // todo is there a delay in the page even if the models are loaded and the editor is not shown?
    }

    // todo on click on a model tab
    loadModel(tabNbr = 0) {
        this.models = this.modelTester.getAllModels();
        let nodes, edges;

        if (this.models.length === 0) {
            nodes = {};
            edges = {};
        } else {
            if (tabNbr >= this.models.length) {
                throw Error("Tab number higher than number of models.");
            }
            console.log(this.models[tabNbr].nodeIds, this.models[tabNbr].edges);
            nodes = this.setupNodes(this.models[tabNbr]);
            edges = this.setupEdges(this.models[tabNbr].edges, nodes);
        }

        this.data = {nodes: nodes, edges: edges};
        console.log(this.data);
        this.drawModelEditor();
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
                node.fixed = {x: 1000};
                node.y = 1000;
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
        // todo set up button click actions
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
