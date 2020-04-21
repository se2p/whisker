import {SearchAlgorithmBuilder} from "../SearchAlgorithmBuilder";
import {MOSA} from "./MOSA";
import {FitnessFunction} from "../FitnessFunction";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {BitstringChromosomeGenerator} from "../../bitstring/BitstringChromosomeGenerator";
import {OneOfStoppingCondition} from "../stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../stoppingconditions/FixedIterationsStoppingCondition";
import {BitstringChromosome} from "../../bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../bitstring/SingleBitFitnessFunction";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {Selection} from "../Selection";
import {RankSelection} from "../operators/RankSelection";

export class MOSABuilder implements SearchAlgorithmBuilder<BitstringChromosome> {

    private _chromosomeGenerator: BitstringChromosomeGenerator;

    private _fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>;

    private _properties: SearchAlgorithmProperties<BitstringChromosome>;

    private _stoppingCondition: StoppingCondition<BitstringChromosome>;

    private _selectionOperator: Selection<BitstringChromosome>;

    constructor() {
        const populationSize = 50;
        const chromosomeLength = 10;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const maxIterations = 100;

        this._properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        this._chromosomeGenerator = new BitstringChromosomeGenerator(this._properties);
        this._stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations));
        this._selectionOperator = new RankSelection();
        this.initializeFitnessFunction(chromosomeLength);
    }

    private initializeFitnessFunction(chromosomeLength: number) {
        this._fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        for (let i = 0; i < chromosomeLength; i++) {
            this._fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
        }
    }

    addChromosomeGenerator(generator: BitstringChromosomeGenerator): SearchAlgorithmBuilder<BitstringChromosome> {
        this._chromosomeGenerator = generator;
        return this;
    }

    addFitnessFunction(fitnessFunction: FitnessFunction<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    addFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>) {
        this._fitnessFunctions = fitnessFunctions;
        return this;
    }

    addProperties(properties: SearchAlgorithmProperties<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._properties = properties;
        return this;
    }

    addStoppingCondition(stoppingCondition: StoppingCondition<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._stoppingCondition = stoppingCondition;
        return this;
    }

    addSelectionOperator(selectionOp: Selection<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._selectionOperator = selectionOp;
        return this;
    }

    buildSearchAlgorithm(): SearchAlgorithm<BitstringChromosome> {
        const mosa: MOSA<BitstringChromosome> = new MOSA();
        mosa.setProperties(this._properties);
        mosa.setChromosomeGenerator(this._chromosomeGenerator);
        mosa.setStoppingCondition(this._stoppingCondition);
        mosa.setFitnessFunctions(this._fitnessFunctions);
        mosa.setSelectionOperator(this._selectionOperator);
        return mosa;
    }

}
