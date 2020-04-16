import {SearchAlgorithmBuilder} from "../SearchAlgorithmBuilder";
import {Chromosome} from "../Chromosome";
import {MOSA} from "./MOSA";
import {ChromosomeGenerator} from "../ChromosomeGenerator";
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

export class MOSABuilder implements SearchAlgorithmBuilder<BitstringChromosome> {

    private _chromosomeGenerator: BitstringChromosomeGenerator;

    private _fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>;

    private _properties: SearchAlgorithmProperties<BitstringChromosome>;

    private _stoppingCondition: StoppingCondition<BitstringChromosome>;

    constructor() {
        const populationSize = 50;
        const chromosomeLength = 10;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const maxIterations = 100;

        this._properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        this._chromosomeGenerator = new BitstringChromosomeGenerator(this._properties);
        this._stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(maxIterations));
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

    buildSearchAlgorithm(): SearchAlgorithm<BitstringChromosome> {
        const mosa: MOSA<BitstringChromosome> = new MOSA();
        mosa.setProperties(this._properties);
        mosa.setChromosomeGenerator(this._chromosomeGenerator);
        mosa.setStoppingCondition(this._stoppingCondition);
        mosa.setFitnessFunctions(this._fitnessFunctions);
        return mosa;
    }

}
