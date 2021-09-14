/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {FitnessFunction} from "./FitnessFunction";
import {SearchAlgorithmProperties} from "./SearchAlgorithmProperties";
import {SingleBitFitnessFunction} from "../bitstring/SingleBitFitnessFunction";
import {Selection} from "./Selection";
import {SearchAlgorithm} from "./SearchAlgorithm";
import {MIO} from "./algorithms/MIO";
import {MOSA} from "./algorithms/MOSA";
import {OneMaxFitnessFunction} from "../bitstring/OneMaxFitnessFunction";
import {FixedIterationsStoppingCondition} from "./stoppingconditions/FixedIterationsStoppingCondition";
import {RankSelection} from "./operators/RankSelection";
import {SearchAlgorithmType} from "./algorithms/SearchAlgorithmType";
import {OnePlusOneEA} from "./algorithms/OnePlusOneEA";
import {RandomSearch} from "./algorithms/RandomSearch";
import {Chromosome} from "./Chromosome";
import {StatementCoverageFitness} from "../testcase/fitness/StatementFitnessFunction";
import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {BitstringChromosomeGenerator} from "../bitstring/BitstringChromosomeGenerator";
import {BitstringChromosome} from "../bitstring/BitstringChromosome";
import {BitflipMutation} from "../bitstring/BitflipMutation";
import {SinglePointCrossover} from "./operators/SinglePointCrossover";
import {FitnessFunctionType} from "./FitnessFunctionType";
import {StatementFitnessFunctionFactory} from "../testcase/fitness/StatementFitnessFunctionFactory";
import {Container} from "../utils/Container";
import {List} from "../utils/List";
import {SimpleGA} from "./algorithms/SimpleGA";
import {NEAT} from "./algorithms/NEAT";
import {LocalSearch} from "./operators/LocalSearch/LocalSearch";

/**
 * A builder to set necessary properties of a search algorithm and build this.
 *
 * @param <C> the type of the chromosomes handled by the search algorithm.
 * @author Sophia Geserer
 */
export class SearchAlgorithmBuilder<C extends Chromosome> {

    /**
     * The generator for the chromosomes of the search algorithm.
     */
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * The map of fitness functions per chromosome.
     */
    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    /**
     * The fitness function for a search algorithm.
     */
    private _fitnessFunction: FitnessFunction<C>;

    /**
     * The map for the heuristic function of chromsomes.
     */
    private _heuristicFunctions: Map<number, (number) => number>;

    /**
     * The properties for the search algorithm.
     */
    private _properties: SearchAlgorithmProperties<C>;

    /**
     * The selection operator for the search algorithm.
     */
    private _selectionOperator: Selection<C>;

    /**
     * The LocalSearch operators which can be used by the algorithm under certain circumstances.
     */
    private _localSearchOperators = new List<LocalSearch<C>>();

    /**
     * The type of the algorithm that will be build.
     */
    private readonly _algorithm: SearchAlgorithmType;

    /**
     * Constructs a builder that holds all necessary properties for a search algorithm.
     * @param algorithm the type of the algorithm that will be build
     */
    constructor(algorithm: SearchAlgorithmType) {
        this._algorithm = algorithm;

        this._setParameterForTesting();
    }

    /**
     * This method sets default values for testing. Usually they are configured in `default.json`.
     * @private
     */
    private _setParameterForTesting(): void {
        const chromosomeLength = 10;
        const iterations = 1000;
        const populationSize = 50;
        const crossoverProbability = 1;
        const mutationProbability = 1;
        const startOfFocusedPhase = 0.5;
        const randomSelectionProbabilityStart = 0.5;
        const randomSelectionProbabilityFocusedPhase = 0;
        const maxArchiveSizeStart = 10;
        const maxArchiveSizeFocusedPhase = 1;
        const maxMutationCountStart = 0;
        const maxMutationCountFocusedPhase = 10;
        const stoppingCondition = new FixedIterationsStoppingCondition(iterations);

        this._properties = new SearchAlgorithmProperties(populationSize, chromosomeLength);
        this._properties.setCrossoverProbability(crossoverProbability);
        this._properties.setMutationProbablity(mutationProbability);
        this._properties.setSelectionProbabilities(randomSelectionProbabilityStart, randomSelectionProbabilityFocusedPhase);
        this._properties.setMaxArchiveSizes(maxArchiveSizeStart, maxArchiveSizeFocusedPhase);
        this._properties.setMaxMutationCounter(maxMutationCountStart, maxMutationCountFocusedPhase);
        this._properties.setStartOfFocusedPhase(startOfFocusedPhase);
        this._properties.setStoppingCondition(stoppingCondition);

        this._chromosomeGenerator = new BitstringChromosomeGenerator(
            this._properties as unknown as SearchAlgorithmProperties<BitstringChromosome>,
            new BitflipMutation(),
            new SinglePointCrossover()) as unknown as ChromosomeGenerator<C>;

        this.initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength, new List());

        this._selectionOperator = new RankSelection();
    }

    /**
     * Adds the generator used to generate chromosomes.
     * @param generator the generator to use
     * @returns the search builder with the applied chromosome generator
     */
    addChromosomeGenerator(generator: ChromosomeGenerator<C>): SearchAlgorithmBuilder<C> {
        this._chromosomeGenerator = generator;
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    /**
     * Initializes the necessary fitness functions.
     * @param fitnessFunctionType the type of the fitness function to initialize
     * @param length the length of the chromosome
     * @param targets specific lines that should be covered
     */
    initializeFitnessFunction(fitnessFunctionType: FitnessFunctionType, length: number, targets: List<string>): SearchAlgorithmBuilder<C> {
        this._fitnessFunctions = new Map<number, FitnessFunction<C>>();
        this._heuristicFunctions = new Map<number, (number) => number>();

        switch (fitnessFunctionType) {
            case FitnessFunctionType.ONE_MAX:
                this._fitnessFunction = new OneMaxFitnessFunction(length) as unknown as FitnessFunction<C>;
                this._initializeOneMaxFitness(length);
                break;
            case FitnessFunctionType.SINGLE_BIT:
                this._initializeSingleBitFitness(length);
                break;
            case FitnessFunctionType.STATEMENT:
                this._initializeStatementFitness(length, targets);
                break;
        }
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    /**
     * Adds the properties needed by the search algorithm.
     * @param properties the properties to use
     * @returns the search builder with the applied properties
     */
    addProperties(properties: SearchAlgorithmProperties<C>): SearchAlgorithmBuilder<C> {
        this._properties = properties;
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    /**
     * Adds the selection operation to use.
     * @param selectionOp the selection operator to use
     * @returns the search builder with the applied selection operation
     */
    addSelectionOperator(selectionOp: Selection<C>): SearchAlgorithmBuilder<C> {
        this._selectionOperator = selectionOp;

        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    /**
     * Adds the LocalSearch operators callable by the given search algorithm
     * @param localSearchOperators the LocalSearch operators to be used by the algorithm
     */
    addLocalSearchOperators(localSearchOperators: List<LocalSearch<C>>): SearchAlgorithmBuilder<C> {
        this._localSearchOperators = localSearchOperators;
        return this;
    }

    /**
     * Builds a new search algorithm with the corresponding properties (e.g. fitness function).
     * @returns the search algorithm with all corresponding information set in the builder
     */
    buildSearchAlgorithm(): SearchAlgorithm<C> {
        let searchAlgorithm: SearchAlgorithm<C>;
        switch (this._algorithm) {
            case SearchAlgorithmType.MOSA:
                searchAlgorithm = this._buildMOSA();
                break;
            case SearchAlgorithmType.MIO:
                searchAlgorithm = this._buildMIO();
                break;
            case SearchAlgorithmType.ONE_PLUS_ONE:
                searchAlgorithm = this._buildOnePlusOne();
                break;
            case SearchAlgorithmType.SIMPLEGA:
                searchAlgorithm = this._buildSimpleGA();
                break;
            case SearchAlgorithmType.NEAT:
                searchAlgorithm = this._buildNEAT() as unknown as SearchAlgorithm<C>
                break;
            case SearchAlgorithmType.RANDOM:
            default:
                searchAlgorithm = this._buildRandom();
        }

        searchAlgorithm.setProperties(this._properties);
        searchAlgorithm.setChromosomeGenerator(this._chromosomeGenerator);

        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'MOSA' search algorithm with all necessary properties.
     */
    private _buildMOSA(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new MOSA();
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        searchAlgorithm.setSelectionOperator(this._selectionOperator);
        searchAlgorithm.setLocalSearchOperators(this._localSearchOperators);

        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'MIO' search algorithm with all necessary properties.
     */
    private _buildMIO(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new MIO();
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        searchAlgorithm.setHeuristicFunctions(this._heuristicFunctions);
        searchAlgorithm.setLocalSearchOperators(this._localSearchOperators);
        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'Random' search algorithm with all necessary properties.
     */
    private _buildRandom(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new RandomSearch();
        searchAlgorithm.setFitnessFunction(this._fitnessFunction);
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'One + One' search algorithm with all necessary properties.
     */
    private _buildOnePlusOne() {
        const searchAlgorithm: SearchAlgorithm<C> = new OnePlusOneEA();
        searchAlgorithm.setFitnessFunction(this._fitnessFunction);
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);

        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'Simple GA' search algorithm with all necessary properties.
     */
    private _buildSimpleGA() {
        const searchAlgorithm: SearchAlgorithm<C> = new SimpleGA();
        searchAlgorithm.setFitnessFunction(this._fitnessFunction);
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        searchAlgorithm.setSelectionOperator(this._selectionOperator);

        return searchAlgorithm;
    }

    /**
     * A helper method that builds the 'NEAT' Neuroevolution search algorithm with all necessary properties.
     */
    private _buildNEAT() {
        const searchAlgorithm: SearchAlgorithm<C> = new NEAT() as unknown as SearchAlgorithm<C>;
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        return searchAlgorithm;
    }

    /**
     * A helper method that initializes the 'One max' fitness function(s).
     */
    private _initializeOneMaxFitness(length: number) {
        for (let i = 0; i < length; i++) {
            this._fitnessFunctions.set(i, new OneMaxFitnessFunction(length) as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => v / length);
        }
    }

    /**
     * A helper method that initializes the 'Single bit' fitness function(s).
     */
    private _initializeSingleBitFitness(chromosomeLength: number) {
        for (let i = 0; i < chromosomeLength; i++) {
            this._fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i) as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => v / chromosomeLength);
        }
    }

    /**
     * A helper method that initializes the 'Statement' fitness function(s).
     */
    private _initializeStatementFitness(chromosomeLength: number, targets: List<string>) {
        // TODO: Check if this is done correctly
        const factory: StatementFitnessFunctionFactory = new StatementFitnessFunctionFactory();
        const fitnesses: List<StatementCoverageFitness> = factory.extractFitnessFunctions(Container.vm, targets);

        if (fitnesses.size() == 1) {
            this._fitnessFunction = fitnesses.get(0) as unknown as FitnessFunction<C>;
        }

        for (let i = 0; i < fitnesses.size(); i++) {
            const fitness = fitnesses.get(i);
            this._fitnessFunctions.set(i, fitness as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => 1 / (1 + v));
        }
    }


    get fitnessFunctions(): Map<number, FitnessFunction<C>> {
        return this._fitnessFunctions;
    }
}
