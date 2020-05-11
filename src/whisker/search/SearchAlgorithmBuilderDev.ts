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
import {SearchAlgorithmBuilder} from "./SearchAlgorithmBuilder";
import {Selection} from "./Selection";
import {SearchAlgorithm} from "./SearchAlgorithm";
import {MIO} from "./algorithms/MIO";
import {MOSA} from "./algorithms/MOSA";
import {OneMaxFitnessFunction} from "../bitstring/OneMaxFitnessFunction";
import {FixedIterationsStoppingCondition} from "./stoppingconditions/FixedIterationsStoppingCondition";
import {RankSelection} from "./operators/RankSelection";
import {FitnessFunctionType, SearchAlgorithmType} from "./algorithms/SearchAlgorithmType";
import {OnePlusOneEA} from "./algorithms/OnePlusOneEA";
import {RandomSearch} from "./algorithms/RandomSearch";
import {Chromosome} from "./Chromosome";
import {StatementCoverageFitness} from "../testcase/StatementFitnessFunction";
import {ChromosomeGenerator} from "./ChromosomeGenerator";
import {BitstringChromosomeGenerator} from "../bitstring/BitstringChromosomeGenerator";
import {BitstringChromosome} from "../bitstring/BitstringChromosome";
import {BitflipMutation} from "../bitstring/BitflipMutation";
import {SinglePointCrossover} from "./operators/SinglePointCrossover";

/**
 * TODO
 */
export class SearchAlgorithmBuilderDev<C extends Chromosome> implements SearchAlgorithmBuilder<C> { // TODO: rename and remove the special builder

    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _fitnessFunction: FitnessFunction<C>;

    private _heuristicFunctions: Map<number, Function>;

    private _properties: SearchAlgorithmProperties<C>;

    private _selectionOperator: Selection<C>;

    private readonly _algorithm: SearchAlgorithmType;

    constructor(algorithm: SearchAlgorithmType) {
        this._algorithm = algorithm;

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

        this.initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, chromosomeLength);

        this._selectionOperator = new RankSelection();
    }

    addChromosomeGenerator(generator: ChromosomeGenerator<C>): SearchAlgorithmBuilder<C> {
        this._chromosomeGenerator = generator;
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    // addFitnessFunction(fitnessFunction: FitnessFunction<C>): SearchAlgorithmBuilder<C> {
    //     this._fitnessFunction = fitnessFunction;
    //     return this as unknown as SearchAlgorithmBuilder<C>;
    // }
    //
    // addFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>):
    //     SearchAlgorithmBuilder<C> {
    //     this._fitnessFunctions = fitnessFunctions;
    //     return this as unknown as SearchAlgorithmBuilder<C>;
    // }

    initializeFitnessFunction(fitnessFunctionType: FitnessFunctionType, length: number): SearchAlgorithmBuilder<C> {
        this._fitnessFunction = new OneMaxFitnessFunction(length) as unknown as FitnessFunction<C>;
        this._fitnessFunctions = new Map<number, FitnessFunction<C>>();
        this._heuristicFunctions = new Map<number, Function>();

        switch(fitnessFunctionType) {
            case FitnessFunctionType.ONE_MAX:
                this._initializeOneMaxFitness(length);
                break;
            case FitnessFunctionType.SINGLE_BIT:
                this._initializeSingleBitFitness(length);
                break;
            case FitnessFunctionType.STATEMENT:
                this._initializeStatementFitness(length);
                break;
        }
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    addProperties(properties: SearchAlgorithmProperties<C>): SearchAlgorithmBuilder<C> {
        this._properties = properties;
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    addSelectionOperator(selectionOp: Selection<C>): SearchAlgorithmBuilder<C> {
        this._selectionOperator = selectionOp;
        return this as unknown as SearchAlgorithmBuilder<C>;
    }

    buildSearchAlgorithm(): SearchAlgorithm<C> {
        let searchAlgorithm: SearchAlgorithm<C>;
        switch (this._algorithm) {
            case SearchAlgorithmType.MIO:
                searchAlgorithm = this._buildMOSA();
                break;
            case SearchAlgorithmType.MOSA:
                searchAlgorithm = this._buildMIO();
                break;
            case SearchAlgorithmType.RANDOM:
                searchAlgorithm = this._buildRandom();
                break;
            case SearchAlgorithmType.ONE_PLUS_ONE:
                searchAlgorithm = this._buildOnePlusOne();
                break;
            default:
                searchAlgorithm = this._buildRandom();
        }

        searchAlgorithm.setProperties(this._properties);
        searchAlgorithm.setChromosomeGenerator(this._chromosomeGenerator);

        return searchAlgorithm;
    }

    private _buildMOSA(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new MOSA();
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        searchAlgorithm.setSelectionOperator(this._selectionOperator);

        return searchAlgorithm;
    }

    private _buildMIO(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new MIO();
        searchAlgorithm.setFitnessFunctions(this._fitnessFunctions);
        searchAlgorithm.setHeuristicFunctions(this._heuristicFunctions);

        return searchAlgorithm;
    }

    private _buildRandom(): SearchAlgorithm<C> {
        const searchAlgorithm: SearchAlgorithm<C> = new RandomSearch();
        searchAlgorithm.setFitnessFunction(this._fitnessFunction);

        return searchAlgorithm;
    }

    private _buildOnePlusOne() {
        const searchAlgorithm: SearchAlgorithm<C> = new OnePlusOneEA();
        searchAlgorithm.setFitnessFunction(this._fitnessFunction);

        return searchAlgorithm;
    }

    private _initializeOneMaxFitness(length: number) {
        for (let i = 0; i < length; i++) {
            this._fitnessFunctions.set(i, new StatementCoverageFitness() as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => v / length);
        }
    }

    private _initializeSingleBitFitness(chromosomeLength: number) {
        for (let i = 0; i < chromosomeLength; i++) {
            this._fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i) as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => v / chromosomeLength);
        }
    }

    private _initializeStatementFitness(chromosomeLength: number) {
        for (let i = 0; i < chromosomeLength; i++) {
            this._fitnessFunctions.set(i, new StatementCoverageFitness() as unknown as FitnessFunction<C>);
            this._heuristicFunctions.set(i, v => v / chromosomeLength);
        }
    }
}
