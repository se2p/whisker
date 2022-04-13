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
import {ActivationTrace} from "../Misc/ActivationTrace";
import {NodeType} from "../NetworkComponents/NodeType";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {InputConnectionMethod} from "../Networks/NetworkChromosome";

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
     * The list of statements in a given scratch project.
     */
    private readonly _scratchStatements: StatementFitnessFunction[];

    /**
     * Constructs a new network loader that loads networks from a saved json file.
     * @param networkSuite the json record of saved networks.
     * @param scratchEvents the extracted Scratch events of a project.
     * @param scratchStatements the extracted statements of a Scratch project.
     */
    constructor(networkSuite: Record<string, (number | string | Record<string, (number | string)>)>,
                scratchEvents: ScratchEvent[], scratchStatements?: StatementFitnessFunction[]) {
        this._networkSuite = networkSuite;
        this._scratchEvents = scratchEvents;
        this._scratchStatements = scratchStatements;
    }

    /**
     * Loads networks from a saved json record.
     * @returns NeatChromosome[] the list of loaded and instantiated networks.
     */
    public loadNetworks(): NeatChromosome[] {
        const networks = [];
        for (const savedNetwork of Object.values(this._networkSuite)) {
            const allNodes: NodeGene[] = [];
            for (const savedNode of Object.values(savedNetwork['Nodes'])) {
                switch (savedNode['t']) {
                    case "I": {
                        const iNode = new InputNode(savedNode['id'], savedNode['sprite'], savedNode['feature']);
                        allNodes.push(iNode);
                        break;
                    }
                    case "B": {
                        const biasNode = new BiasNode(savedNode['id']);
                        allNodes.push(biasNode);
                        break;
                    }
                    case "H": {
                        const activationFunction = savedNode['aF'] as string;
                        const hiddenNode = new HiddenNode(savedNode['id'], ActivationFunction[activationFunction]);
                        allNodes.push(hiddenNode);
                        break;
                    }
                    case "C": {
                        const event = this._scratchEvents.find(event => event.stringIdentifier() === savedNode['event']);
                        if (event) {
                            const classificationNode = new ClassificationNode(savedNode['id'], event,
                                ActivationFunction.NONE);
                            allNodes.push(classificationNode);
                        }
                        break;
                    }
                    case "R": {
                        const event = this._scratchEvents.find(event => event.stringIdentifier() === savedNode['event']);
                        if (event) {
                            const regressionNode = new RegressionNode(savedNode['id'], event, savedNode['eventP'],
                                ActivationFunction.NONE);
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
            const crossover = new NeatCrossover({});
            const activationFunction = savedNetwork['aF'] as string;
            const connectionMethod = savedNetwork['cM'] as InputConnectionMethod;
            const network = new NeatChromosome(allNodes, allConnections, mutation, crossover, connectionMethod,
                ActivationFunction[activationFunction]);

            // If the generated networks are based on the StatementFitness function, we load their fitness targets.
            if (savedNetwork['tf']) {
                const targetId = savedNetwork['tf'];
                for (const statement of this._scratchStatements) {
                    if (statement.getTargetNode().id === targetId) {
                        network.targetFitness = statement;
                    }
                }
            }

            // Load the saved AT if there is one.
            if(savedNetwork['AT'] !== undefined) {
                NetworkLoader.loadActivationTrace(network, savedNetwork['AT']);
            }
            networks.push(network);
        }
        return networks;
    }

    /**
     * Loads the activation trace into the savedActivationTrace value.
     * @param network the network into which the trace will we loaded
     * @param savedTrace the trace that should be loaded into the network.
     */
    public static loadActivationTrace(network: NeatChromosome,
                                      savedTrace: Record<string, Record<string, number[]>>): void {
        network.referenceActivationTrace = new ActivationTrace(network.allNodes.filter(node => node.type === NodeType.INPUT));
        for (const [step, nodeTraces] of Object.entries(savedTrace)) {
            const nodeStepTraces = new Map<string, number[]>();
            for (const [nodeId, activationValues] of Object.entries(nodeTraces)) {
                nodeStepTraces.set(nodeId, activationValues);
            }
            network.referenceActivationTrace.trace.set(Number(step), nodeStepTraces);
        }
    }
}
