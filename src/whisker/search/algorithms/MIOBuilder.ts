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

import {SearchAlgorithmBuilder} from "../SearchAlgorithmBuilder";
import {FitnessFunction} from "../FitnessFunction";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {BitstringChromosomeGenerator} from "../../bitstring/BitstringChromosomeGenerator";
import {FixedIterationsStoppingCondition} from "../stoppingconditions/FixedIterationsStoppingCondition";
import {BitstringChromosome} from "../../bitstring/BitstringChromosome";
import {SingleBitFitnessFunction} from "../../bitstring/SingleBitFitnessFunction";
import {SearchAlgorithm} from "../SearchAlgorithm";
import {NotSupportedFunctionException} from "../../core/exceptions/NotSupportedFunctionException";
import {Selection} from "../Selection";
import {MIO} from "./MIO";

/**
 * Builder for the MIO algorithm.
 *
 * @author Sophia Geserer
 */
export class MIOBuilder implements SearchAlgorithmBuilder<BitstringChromosome> {

    private _chromosomeGenerator: BitstringChromosomeGenerator;

    private _fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>;

    private _heuristicFunctions: Map<number, Function>;

    private _properties: SearchAlgorithmProperties<BitstringChromosome>;

    private _stoppingCondition: StoppingCondition<BitstringChromosome>;

    private _startFocusedPhase: number;
    private _randomSelectionProbabilityStart: number;
    private _randomSelectionProbabilityFocusedPhase: number;
    private _maxArchiveSizeStart: number;
    private _maxArchiveSizeFocusedPhase: number;
    private _maxMutationCountStart: number;
    private _maxMutationCountFocusedPhase: number;

    constructor() {
        const chromosomeLength = 10;
        const iterations = 1000;
        const populationSize = null;
        const crossoverProbability = null;
        const mutationProbability = null;

        this._startFocusedPhase = 0.5;
        this._randomSelectionProbabilityStart = 0.5;
        this._randomSelectionProbabilityFocusedPhase = 0;
        this._maxArchiveSizeStart = 10;
        this._maxArchiveSizeFocusedPhase = 1;
        this._maxMutationCountStart = 0;
        this._maxMutationCountFocusedPhase = 10;

        this._properties = new SearchAlgorithmProperties(populationSize, chromosomeLength, crossoverProbability, mutationProbability);
        this._chromosomeGenerator = new BitstringChromosomeGenerator(this._properties);
        this._stoppingCondition = new FixedIterationsStoppingCondition(iterations);
        this.initializeFitnessAndHeuristicFunction(chromosomeLength);
    }

    private initializeFitnessAndHeuristicFunction(chromosomeLength: number) {
        this._fitnessFunctions = new Map<number, FitnessFunction<BitstringChromosome>>();
        this._heuristicFunctions = new Map<number, Function>();
        for (let i = 0; i < chromosomeLength; i++) {
            this._fitnessFunctions.set(i, new SingleBitFitnessFunction(chromosomeLength, i));
            this._heuristicFunctions.set(i, v => v / chromosomeLength);
        }
    }

    addChromosomeGenerator(generator: BitstringChromosomeGenerator): SearchAlgorithmBuilder<BitstringChromosome> {
        this._chromosomeGenerator = generator;
        return this;
    }

    addFitnessFunction(fitnessFunction: FitnessFunction<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    addFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<BitstringChromosome>>):
        SearchAlgorithmBuilder<BitstringChromosome> {
        this._fitnessFunctions = fitnessFunctions;
        return this;
    }

    addHeuristicFunctions(heuristicFunctions: Map<number, Function>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._heuristicFunctions = heuristicFunctions;
        return this;
    }

    addProperties(properties: SearchAlgorithmProperties<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        this._properties = properties;
        return this;
    }

    addStoppingCondition(stoppingCondition: StoppingCondition<BitstringChromosome>):
        SearchAlgorithmBuilder<BitstringChromosome> {
        this._stoppingCondition = stoppingCondition;
        return this;
    }

    addSelectionOperator(selectionOp: Selection<BitstringChromosome>): SearchAlgorithmBuilder<BitstringChromosome> {
        throw new NotSupportedFunctionException();
    }

    addSelectionProbabilities(randomSelectionProbabilityStart: number, randomSelectionProbabilityFocusedPhase: number):
        SearchAlgorithmBuilder<BitstringChromosome> {
        this._randomSelectionProbabilityStart = randomSelectionProbabilityStart;
        this._randomSelectionProbabilityFocusedPhase = randomSelectionProbabilityFocusedPhase;
        return this;
    }

    addArchiveSizes(maxArchiveSizeStart: number, maxArchiveSizeFocusedPhase: number):
        SearchAlgorithmBuilder<BitstringChromosome> {
        this._maxArchiveSizeStart = maxArchiveSizeStart;
        this._maxArchiveSizeFocusedPhase = maxArchiveSizeFocusedPhase;
        return this;
    }

    addMutationCounter(maxMutationCountStart: number, maxMutationCountFocusedPhase: number):
        SearchAlgorithmBuilder<BitstringChromosome> {
        this._maxMutationCountStart = maxMutationCountStart;
        this._maxMutationCountFocusedPhase = maxMutationCountFocusedPhase;
        return this;
    }

    buildSearchAlgorithm(): SearchAlgorithm<BitstringChromosome> {
        const mio: MIO<BitstringChromosome> = new MIO();
        mio.setProperties(this._properties);
        mio.setChromosomeGenerator(this._chromosomeGenerator);
        mio.setStoppingCondition(this._stoppingCondition);
        mio.setFitnessFunctions(this._fitnessFunctions);
        mio.setHeuristicFunctions(this._heuristicFunctions);
        mio.setSelectionProbabilities(this._randomSelectionProbabilityStart, this._randomSelectionProbabilityFocusedPhase);
        mio.setArchiveSizes(this._maxArchiveSizeStart, this._maxArchiveSizeFocusedPhase);
        mio.setMutationCounter(this._maxMutationCountStart, this._maxMutationCountFocusedPhase);
        mio.setStartOfFocusedPhase(this._startFocusedPhase);
        return mio;
    }

}
