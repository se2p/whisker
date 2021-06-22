const {$} = require('../web-libs');
const vis = require('vis-network');
const {i18n} = require("../index");

class ModelEditor {

    static ID_FIELD = "#editor-id";
    static LABEL_FIELD = '#editor-label';
    static OP_NAME_FIELD = '#model-editor-operation';

    constructor(modelTester) {
        this.modelTester = modelTester;
        this.network = null;
        this.data = null;
        this.container = document.getElementById("model-editor-canvas");
        this.nodes = [];
        this.edges = []
    }

    drawModelEditor() {
        // todo get new nodes and edges based on the loaded models
        // todo make a new view for each model -> multiple networks
        let nodes = [
            {id: 1, label: "Start", color: "rgb(0,151,163)", title:"test"},
            {id: 2, label: "End"}
        ];

        // create an array with edges
        let edges = [
            {
                from: 1, to: 2,
                font: {align: "top"},
                condition: "Function:true",
                effect: "VarComp:Stage:Zeit:=:30,VarComp:Stage:Punkte:=:0,AttrComp:Bowl:x:=:0,AttrComp:Bowl:y:=:-145",
                color: "#000000",
                arrows: {
                    to: {
                        enabled: true,
                        type: "triangle",
                    },
                },
            },
            {
                from: 2, to: 2,
                color: "#000000",
                title: "Keine Bedingung | 4 Effekte ",
                arrows: {
                    to: {
                        enabled: true,
                        type: "triangle",
                    },
                },
            }
        ];
        //Stage.Zeit == 30 && Stage.Punkte == 0 && Bowl.x == 0 &&" +
        //                     " Bowl.y == -145 & Apple.size == 50 && Bananas.size == 50"
        //Stage.Zeit <= 30 && Bowl.y == -145 && Apple.size == 50 &&" +
        //                     " Bananas.size == 50

        this.data = {
            nodes: nodes,
            edges: edges,
        };

        // const editNode = this.editNode;
        // const clearNodePopUp = this.clearNodePopUp;
        // const cancelNodeEdit = this.cancelNodeEdit;
        // const editEdgeWithoutDrag = this.editEdgeWithoutDrag;

        this.options = {
            // manipulation: {
            //     addNode: function (data, callback) {
            //         console.log("add node test");
            //     },
            //     editNode: function (data, callback) {
            //         console.log("edit node test");
            //     },
            //     addEdge: function (data, callback) {
            //         console.log("add edge test");
            //         // if (data.from === data.to) {
            //         //     let r = confirm("Do you want to connect the node to itself?");
            //         //     if (r !== true) {
            //         //         callback(null);
            //         //         return;
            //         //     }
            //         // }
            //         // $("model-edge-operation").innerText = "Add Edge";
            //         // editEdgeWithoutDrag(data, callback);
            //     },
            //     editEdge: function (edgeData, callback) {
            //         console.log("edit edge test");
            //         // $("model-edge-operation").innerText = "Edit Edge";
            //         // editEdgeWithoutDrag(data, callback);
            //     }
            // },
            layout:{randomSeed:2},
            physics: true,
            manipulation: {
                addNode: function (data, callback) {
                    $(ModelEditor.OP_NAME_FIELD).text(i18n.t("model-editor:addNode"));
                    $(ModelEditor.ID_FIELD).val(data.id);
                    $(ModelEditor.LABEL_FIELD).val(data.label);
                    document.getElementById("saveButton").onclick = saveData.bind(
                        this,
                        data,
                        callback
                    );
                    document.getElementById("cancelButton").onclick = clearPopUp.bind();
                },
                editNode: function (data, callback) {
                    $(ModelEditor.OP_NAME_FIELD).text(i18n.t("model-editor:editNode"));
                    $(ModelEditor.ID_FIELD).val(data.id);
                    $(ModelEditor.LABEL_FIELD).val(data.label);

                    document.getElementById("saveButton").onclick = saveData.bind(
                        this,
                        data,
                        callback
                    );
                    document.getElementById("cancelButton").onclick = cancelEdit.bind(
                        this,
                        callback
                    );
                },
                addEdge: function (data, callback) {
                    if (data.from == data.to) {
                        var r = confirm("Do you want to connect the node to itself?");
                        if (r == true) {
                            callback(data);
                        }
                    } else {
                        callback(data);
                    }
                },
            },
            locale: $('#lang-select').val(),
            autoResize: true,
            height: '100%',
            width: '100%',
            clickToUse: false
        };

        function clearPopUp() {
            document.getElementById("saveButton").onclick = null;
            document.getElementById("cancelButton").onclick = null;
        //     document.getElementById("model-editor-configuration").style.display = "none";
        }

        function cancelEdit(callback) {
            clearPopUp();
            callback(null);
        }

        function saveData(data, callback) {
            data.id = $(ModelEditor.ID_FIELD).val();
            data.label = $(ModelEditor.LABEL_FIELD).val();
            callback(data);
        }

        this.network = new vis.Network(this.container, this.data, this.options);
        this.network.enableEditMode();
        this.network.on('selectNode', this.network.editNode);
        this.network.on('deselectNode', () => {
            $('#model-editor-operation').text(i18n.t(""));
            $('#editor-id').val("");
            $('#editor-label').val("");
        });
    }

    editNode(data, cancelAction, callback) {
        $("model-node-label").value = data.label;
        $("model-node-saveButton").onclick = this.saveNodeData.bind(
            this,
            data,
            callback
        );
        $("model-node-cancelButton").onclick = cancelAction.bind(
            this,
            callback
        );
    }

// Callback passed as parameter is ignored
    clearNodePopUp() {
        $("model-node-saveButton").onclick = null;
        $("model-node-cancelButton").onclick = null;
    }

    cancelNodeEdit(callback) {
        this.clearNodePopUp();
        callback(null);
    }

    saveNodeData(data, callback) {
        data.label = $("model-node-label").value;
        this.clearNodePopUp();
        callback(data);
    }

    editEdgeWithoutDrag(data, callback) {
        // filling in the popup DOM elements
        $("model-edge-label").value = data.label;
        $("model-edge-saveButton").onclick = this.saveEdgeData.bind(
            this,
            data,
            callback
        );
        $("model-edge-cancelButton").onclick = this.cancelEdgeEdit.bind(
            this,
            callback
        );
        $("model-edge-popUp").style.display = "block";
    }

    clearEdgePopUp() {
        $("model-edge-saveButton").onclick = null;
        $("model-edge-cancelButton").onclick = null;
        $("model-edge-popUp").style.display = "none";
    }

    cancelEdgeEdit(callback) {
        this.clearEdgePopUp();
        callback(null);
    }

    saveEdgeData(data, callback) {
        if (typeof data.to === "object") data.to = data.to.id;
        if (typeof data.from === "object") data.from = data.from.id;
        data.label = $("model-edge-label").value;
        this.clearEdgePopUp();
        callback(data);
    }

}

module.exports = ModelEditor;
