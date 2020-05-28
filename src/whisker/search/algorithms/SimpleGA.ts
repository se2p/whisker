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
 * along with Whisker. ßIf not, see http://www.gnu.org/licenses/.
 *
 */

import {Chromosome} from '../Chromosome';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {Selection} from "../Selection";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {PopulationFactory} from "../PopulationFactory";
import {Randomness} from "../../utils/Randomness";

export class SimpleGA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _fitnessFunction: FitnessFunction<C>;

    private _fitnessFunctions: List<FitnessFunction<C>> = new List();

    private _stoppingCondition: StoppingCondition<C>;

    private _selectionOperator: Selection<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _bestLength = 0;

    private _bestFitness = 0;

    private _startTime: number;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>) {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>) {
        this._fitnessFunction = fitnessFunction;
        this._fitnessFunctions.clear();
        this._fitnessFunctions.add(fitnessFunction);
    }

    setSelectionOperator(selectionOperator: Selection<C>) {
        this._selectionOperator = selectionOperator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>) {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    findSolution(): List<C> {

        // set start time
        this._startTime = Date.now();

        // Initialise population
        let population = PopulationFactory.generate(this._chromosomeGenerator, this._properties.getPopulationSize());

        // Evaluate population
        this.evaluateAndSortPopulation(population);

        while(!this._stoppingCondition.isFinished(this)) {
            this._iterations++;

            const nextGeneration = this.generateOffspringPopulation(population);
            this.evaluateAndSortPopulation(nextGeneration)
            population = nextGeneration;
        }
        return this._bestIndividuals;
    }

    /**
     * Evaluate fitness for all individuals, sort by fitness
     *
     * @param population The population to evaluate
     */
    private evaluateAndSortPopulation(population: List<C>) : void {
        population.sort((c1: C, c2: C) => {
            const fitness1 = this._fitnessFunction.getFitness(c1);
            const fitness2 = this._fitnessFunction.getFitness(c2);

            if (fitness1 == fitness2) {
                return c2.getLength() - c1.getLength();
            } else {
                return this._fitnessFunction.compare(fitness1, fitness2);
            }
        });

        const bestIndividual = population.get(population.size() - 1);
        const candidateFitness = this._fitnessFunction.getFitness(bestIndividual);
        const candidateLength = bestIndividual.getLength();
        if (this._bestIndividuals.isEmpty() ||
                this._fitnessFunction.compare(candidateFitness, this._bestFitness) > 0 ||
                (this._fitnessFunction.compare(candidateFitness, this._bestFitness) == 0 && candidateLength < this._bestLength)) {
                this._bestLength = candidateLength;
                this._bestFitness = candidateFitness;
                this._bestIndividuals.clear();
                this._bestIndividuals.add(bestIndividual);
        }
    }


    /**
     * Generates an offspring population by evolving the parent population using selection,
     * crossover and mutation.
     *
     *
     * @param parentPopulation The population to use for the evolution.
     * @param useRankSelection Whether to use rank selection for selecting the parents.
     * @returns The offspring population.
     */
    private generateOffspringPopulation(parentPopulation: List<C>): List<C> {
        // TODO: This is largely a clone taken from MOSA.ts. Could abstract this.
        const offspringPopulation = new List<C>();

        // Very basic elitism
        // TODO: This should be configurable
        offspringPopulation.add(parentPopulation.get(parentPopulation.size() - 1));

        while (offspringPopulation.size() < parentPopulation.size()) {
            const parent1 = this._selectionOperator.apply(parentPopulation, this._fitnessFunction);
            const parent2 = this._selectionOperator.apply(parentPopulation, this._fitnessFunction);

            let child1 = parent1;
            let child2 = parent2;
            if (Randomness.getInstance().nextDouble() < this._properties.getCrossoverProbability()) {
                const crossover = parent1.crossover(parent2);
                child1 = crossover.getFirst();
                child2 = crossover.getSecond();
            }
            if (Randomness.getInstance().nextDouble() < this._properties.getMutationProbablity()) {
                child1 = child1.mutate();
            }
            if (Randomness.getInstance().nextDouble() < this._properties.getMutationProbablity()) {
                child2 = child2.mutate();
            }
            offspringPopulation.add(child1);
            if (offspringPopulation.size() < parentPopulation.size()) {
                offspringPopulation.add(child2);
            }
        }
        return offspringPopulation;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions;
    }

    getStartTime(): number {
        return this._startTime;
    }
}
