import {ChromosomeGenerator} from "../../../search/ChromosomeGenerator";
import {NodeGene} from "../networkComponents/NodeGene";
import {NeatMutation} from "../operators/NeatMutation";
import {ActivationFunction} from "../networkComponents/ActivationFunction";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {NeatCrossover} from "../operators/NeatCrossover";
import {NeatChromosome} from "../networks/NeatChromosome";
import {InputConnectionMethod, NetworkLayer} from "../networks/NetworkChromosome";
import {InputNode} from "../networkComponents/InputNode";
import {BiasNode} from "../networkComponents/BiasNode";
import {ActionNode} from "../networkComponents/ActionNode";
import {MouseMoveDimensionEvent} from "../../../testcase/events/MouseMoveDimensionEvent";
import {InputFeatures} from "../../featureExtraction/FeatureExtraction";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    /**
     * Constructs a new NeatChromosomeGenerator.
     * @param _inputSpace determines the input nodes of the network to generate.
     * @param _outputSpace determines the output nodes of the network to generate.
     * @param _inputConnectionMethod determines how the input layer will be connected to the output layer.
     * @param _hiddenActivationFunction the activation function used for generated hidden nodes.
     * @param _outputActivationFunction the activation function used for generated output nodes.
     * @param _mutationOperator the mutation operator.
     * @param _crossoverOperator the crossover operator.
     * @param _inputRate governs the probability of adding multiple input groups to the network when a sparse
     * connection method is being used.
     */
    public constructor(private _inputSpace: InputFeatures,
                       private _outputSpace: ScratchEvent[],
                       protected readonly _inputConnectionMethod: InputConnectionMethod,
                       protected readonly _hiddenActivationFunction: ActivationFunction,
                       protected readonly _outputActivationFunction: ActivationFunction.SIGMOID | ActivationFunction.SOFTMAX,
                       private _mutationOperator: NeatMutation,
                       private _crossoverOperator: NeatCrossover,
                       private _inputRate = 0.3) {
    }

    /**
     * Generates a single NeatChromosome using the specified connection method.
     * @returns generated NeatChromosome.
     */
    async get(): Promise<NeatChromosome> {
        const layer: NetworkLayer = new Map<number, NodeGene[]>();
        layer.set(0, []);

        // Input layer
        let numNodes = 0;
        for (const [sprite, featureMap] of this._inputSpace) {
            for (const feature of featureMap.keys()) {
                const featureInputNode = new InputNode(numNodes++, sprite, feature);
                layer.get(0).push(featureInputNode);
            }
        }

        // Bias node
        const biasNode = new BiasNode(numNodes++);
        layer.get(0).push(biasNode);

        // Output layer
        layer.set(1, []);
        for (const event of this._outputSpace) {
            layer.get(1).push(new ActionNode(numNodes++, this._outputActivationFunction, event, event instanceof MouseMoveDimensionEvent));
        }

        const chromosome = new NeatChromosome(layer, [], this._mutationOperator, this._crossoverOperator,
            this._inputConnectionMethod, this._hiddenActivationFunction, this._outputActivationFunction);
        const outputNodes = [...chromosome.layers.get(1).values()];
        chromosome.connectNodesToInputLayer(outputNodes, this._inputConnectionMethod, this._inputRate);

        return chromosome;
    }

    setMutationOperator(mutationOp: NeatMutation): void {
        this._mutationOperator = mutationOp;
    }

    setCrossoverOperator(crossoverOp: NeatCrossover): void {
        this._crossoverOperator = crossoverOp;
    }
}
