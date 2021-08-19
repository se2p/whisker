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
import {Selection} from "../Selection";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";

export class SimpleGA<C extends Chromosome> extends SearchAlgorithmDefault<C> {

    /**
     * Defines the selection operator used by this SimpleGA instance.
     */
    private _selectionOperator: Selection<C>;

    /**
     * Shortest Chromosome seen so far.
     */
    private _bestLength = 0;

    /**
     * Best performing Chromosome seen so far.
     */
    private _bestFitness = 0;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<C>): void {
        this._fitnessFunction = fitnessFunction;
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        this._selectionOperator = selectionOperator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    private generateInitialPopulation(): List<C> {
        const population = new List<C>();
        for (let i = 0; i < this._properties.getPopulationSize(); i++) {
            if (this._stoppingCondition.isFinished(this)) {
                break;
            }
            population.add(this._chromosomeGenerator.get());
        }
        return population;
    }

    /**
     * Returns a list of possible admissible solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {

        // set start time
        this._startTime = Date.now();

        StatisticsCollector.getInstance().iterationCount = 0;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 0;
        StatisticsCollector.getInstance().startTime = Date.now();

        console.log(`Simple GA started at ${this._startTime}`);

        // Initialise population
        let population = this.generateInitialPopulation();
        await this.evaluatePopulation(population);

        // Evaluate population, but before check if we have already reached our stopping condition
        if(!(this._stoppingCondition.isFinished(this))) {
            this.evaluateAndSortPopulation(population);
        }

        while (!(this._stoppingCondition.isFinished(this))) {
            console.log(`Iteration ${this._iterations}, best fitness: ${this._bestFitness}`);

            const nextGeneration = this.generateOffspringPopulation(population);
            await this.evaluatePopulation(nextGeneration);
            if(!(this._stoppingCondition.isFinished(this))) {
                this.evaluateAndSortPopulation(nextGeneration);
            }
            population = nextGeneration;
            this._iterations++;
            this.updateStatistics();
        }

        console.log(`Simple GA completed at ${Date.now()}`);

        return this._archive;
    }

    /**
     * Evaluate fitness for all individuals, sort by fitness
     *
     * @param population The population to evaluate
     */
    private evaluateAndSortPopulation(population: List<C>): void {
        const fitnesses = new Map();

        for (const c of population) {
            const fitness = this._fitnessFunction.getFitness(c);
            fitnesses.set(c, fitness);
        }

        population.sort((c1: C, c2: C) => {
            const fitness1 = fitnesses.get(c1);
            const fitness2 = fitnesses.get(c2);

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
            if (this._fitnessFunction.isOptimal(candidateFitness) && !this._fitnessFunction.isOptimal(this._bestFitness)) {
                StatisticsCollector.getInstance().coveredFitnessFunctionsCount = 1;
                StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                    (this._iterations + 1) * this._properties.getPopulationSize();
                StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
            }
            this._bestLength = candidateLength;
            this._bestFitness = candidateFitness;
            this._bestIndividuals.clear();
            this._bestIndividuals.add(bestIndividual);
            console.log(`Found new best solution with fitness: ${this._bestFitness}`);
        }
    }


    /**
     * Generates an offspring population by evolving the parent population using selection,
     * crossover and mutation.
     *
     * @param parentPopulation The population to use for the evolution.
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
        if(this._fitnessFunctions) {
            return this._fitnessFunctions.values();
        }
        return [this._fitnessFunction];
    }

    getStartTime(): number {
        return this._startTime;
    }
}
