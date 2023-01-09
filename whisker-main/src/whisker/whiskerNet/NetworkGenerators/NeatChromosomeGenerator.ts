import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {NeatMutation} from "../Operators/NeatMutation";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {InputConnectionMethod, NetworkLayer} from "../Networks/NetworkChromosome";
import {InputNode} from "../NetworkComponents/InputNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {InputFeatures} from "../Misc/InputExtraction";
import {Randomness} from "../../utils/Randomness";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    /**
     * Constructs a new NeatChromosomeGenerator.
     * @param _inputSpace determines the input nodes of the network to generate.
     * @param _outputSpace determines the output nodes of the network to generate.
     * @param _inputConnectionMethod determines how the input layer will be connected to the output layer.
     * @param _activationFunction the activation function used for the generated nodes.
     * @param _mutationOperator the mutation operator.
     * @param _crossoverOperator the crossover operator.
     * @param _inputRate governs the probability of adding multiple input groups to the network when a sparse
     * connection method is being used.
     */
    public constructor(private readonly _inputSpace: InputFeatures,
                       private readonly _outputSpace: ScratchEvent[],
                       protected readonly _inputConnectionMethod: InputConnectionMethod,
                       protected readonly _activationFunction: ActivationFunction,
                       private _mutationOperator: NeatMutation,
                       private _crossoverOperator: NeatCrossover,
                       private _inputRate = 0.3) {
    }

    /**
     * Generates a single NeatChromosome using the specified connection method.
     * @returns generated NeatChromosome.
     */
    get():
        NeatChromosome {
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, []);

        // Create the Input Nodes
        let numNodes = 0;
        for (const [sprite, featureMap] of this._inputSpace) {
            for (const feature of featureMap.keys()) {
                const featureInputNode = new InputNode(numNodes++, sprite, feature);
                layer.get(0).push(featureInputNode);
            }
        }

        // Add the Bias
        const biasNode = new BiasNode(numNodes++);
        layer.get(0).push(biasNode);

        // Create the classification output nodes and add them to the nodes list
        layer.set(1, []);
        for (const event of this._outputSpace) {
            const classificationNode = new ClassificationNode(numNodes++, event, ActivationFunction.NONE);
            layer.get(1).push(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._outputSpace.filter(event => event.numSearchParameter() > 0);
        if (parameterizedEvents.length !== 0) {
            this.addRegressionNodes(numNodes, layer, parameterizedEvents);
        }

        // Create connections between input and output nodes
        const chromosome = new NeatChromosome(layer, [], this._mutationOperator, this._crossoverOperator,
            this._inputConnectionMethod, this._activationFunction);
        const outputNodes = [...chromosome.layers.get(1).values()];
        chromosome.connectNodeToInputLayer(outputNodes, this._inputConnectionMethod, this._inputRate);

        // Assign randomised weights.
        const connections = chromosome.connections;
        for (const connection of connections) {
            connection.weight = Randomness.getInstance().nextDoubleMinMax(-1, 1);
        }
        return chromosome;
    }

    /**
     * Adds regression nodes to the network.
     * @param nodeId the id that will be assigned to the regression node.
     * @param layer the map of layers to which the node will be added.
     * @param parameterizedEvents contains all parameterized Events of the given Scratch-Project.
     */
    protected addRegressionNodes(nodeId: number, layer: NetworkLayer, parameterizedEvents: ScratchEvent[]): void {
        for (const event of parameterizedEvents) {
            for (const parameter of event.getSearchParameterNames()) {
                // Create the regression Node and add it to the NodeList
                const regressionNode = new RegressionNode(nodeId++, event, parameter);
                layer.get(1).push(regressionNode);
            }
        }
    }

    setMutationOperator(mutationOp: NeatMutation): void {
        this._mutationOperator = mutationOp;
    }

    setCrossoverOperator(crossoverOp: NeatCrossover): void {
        this._crossoverOperator = crossoverOp;
    }
}
