import {NeatChromosome} from "../Networks/NeatChromosome";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {InputNode} from "../NetworkComponents/InputNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatMutation} from "../Operators/NeatMutation";
import {NeatCrossover} from "../Operators/NeatCrossover";

export class NetworkLoader {

    /**
     * The saved network suite that should be loaded in a json format.
     */
    private readonly _networkSuite: Record<string, (number | string | Record<string, (number | string)>)>

    /**
     * All ScratchEvents for which output nodes have to be generated.
     */
    private readonly _scratchEvents: ScratchEvent[];

    /**
     * Constructs a new network loader that loads networks from a saved json file.
     * @param networkSuite
     * @param scratchEvents
     */
    constructor(networkSuite: string, scratchEvents: ScratchEvent[]) {
        this._networkSuite = JSON.parse(networkSuite);
        this._scratchEvents = scratchEvents;
        console.log("Events: ", scratchEvents)
    }

    public loadNetwork(): NeatChromosome[] {
        const networks = [];
        for (const savedNetwork of Object.values(this._networkSuite)) {
            const allNodes: NodeGene[] = [];
            for (const savedNode of Object.values(savedNetwork['Nodes'])) {
                switch (savedNode['t']) {
                    case "I": {
                        const iNode = new InputNode(savedNode['sprite'], savedNode['feature'],
                            false);
                        iNode.uID = savedNode['id'];
                        allNodes.push(iNode);
                        break;
                    }
                    case "B": {
                        const biasNode = new BiasNode(false);
                        biasNode.uID = savedNode['id'];
                        allNodes.push(biasNode);
                        break;
                    }
                    case "H": {
                        const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID, false);
                        hiddenNode.uID = savedNode['id'];
                        allNodes.push(hiddenNode);
                        break;
                    }
                    case "C": {
                        const event = this._scratchEvents.find(event => event.stringIdentifier() === savedNode['event']);
                        console.log(event)
                        if (event) {
                            const classificationNode = new ClassificationNode(event, ActivationFunction.SIGMOID, false);
                            classificationNode.uID = savedNode['id'];
                            allNodes.push(classificationNode);
                        }
                        break;
                    }
                    case "R": {
                        const event = this._scratchEvents.find(event => event.stringIdentifier() === savedNode['event']);
                        if (event) {
                            const regressionNode = new RegressionNode(event, savedNode['eventP'], ActivationFunction.NONE);
                            regressionNode.uID = savedNode['id'];
                            allNodes.push(regressionNode);
                        }
                        break;
                    }
                }
            }
            const allConnections: ConnectionGene[] = [];
            for (const savedConnection of Object.values(savedNetwork['Cons'])) {
                const sourceNode = allNodes.find(node => node.uID === savedConnection['s']);
                const targetNode = allNodes.find(node => node.uID === savedConnection['t']);
                const recurrent = savedConnection['r'] === `true`;
                if (sourceNode && targetNode) {
                    allConnections.push(new ConnectionGene(sourceNode, targetNode, savedConnection['w'],
                        savedConnection['e'], savedConnection['i'], recurrent));
                }
            }
            const mutation = new NeatMutation({});
            const crossover = new NeatCrossover({})
            const network = new NeatChromosome(allNodes, allConnections, mutation, crossover);
            networks.push(network);
        }
        return networks;
    }
}
