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

import { Chromosome } from "../Chromosome";
import { SearchAlgorithmProperties } from "../SearchAlgorithmProperties";
import { ChromosomeGenerator } from "../ChromosomeGenerator";
import { FitnessFunction } from "../FitnessFunction";
import { Selection } from "../Selection";
import { SearchAlgorithm } from "../SearchAlgorithm";
import { LocalSearch } from "../operators/LocalSearch/LocalSearch";
import { StatisticsCollector } from "../../utils/StatisticsCollector";
import { StoppingCondition } from "../StoppingCondition";
import { TestChromosome } from "../../testcase/TestChromosome";
import Arrays from "../../utils/Arrays";
import { emitCoverageUpdate, emitFitnessUpdate, emitCdgUpdate } from "../../utils/ReportingEvents";
import { Container } from "../../utils/Container";
import { StatementFitnessFunction } from "../../testcase/fitness/StatementFitnessFunction";

/**
 * Represents a strategy to search for an approximated solution to a given problem.
 *
 * @param <C> the solution encoding of the problem
 * @author Sophia Geserer
 */
export abstract class SearchAlgorithmDefault<C extends Chromosome> implements SearchAlgorithm<C> {

    /**
     * Defines SearchParameters set within the config file.
     */
    protected _properties: SearchAlgorithmProperties<C>;

    /**
     * Generator responsible for generating initial Chromosome.
     */
    protected _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * Defines the stopping condition of the SearchAlgorithm.
     */
    protected _stoppingCondition: StoppingCondition<C>;

    /**
     * Archive mapping to each fitnessFunction the Chromosome solving it.
     */
    protected _archive = new Map<number, C>();

    /**
     * List of best performing Chromosomes.
     */
    protected _bestIndividuals: C[] = [];

    /**
     * FitnessFunction the concrete SearchAlgorithm is optimizing for.
     */
    protected _fitnessFunction: FitnessFunction<C>;

    /**
     * Maps each FitnessFunction to a unique identifier.
     */
    protected _fitnessFunctions: Map<number, FitnessFunction<C>>;

    /**
     * Boolean determining if we have reached full test coverage.
     */
    protected _fullCoverageReached = false;

    /**
     * Saves the number of generations.
     */
    protected _iterations = 0;

    /**
     * Starting time of the algorithm.
     */
    protected _startTime: number;

    abstract findSolution(): Promise<Map<number, C>>;

    abstract setProperties(properties: SearchAlgorithmProperties<C>): void;

    abstract setChromosomeGenerator(generator: ChromosomeGenerator<C>): void;

    abstract setFitnessFunction(fitnessFunction: FitnessFunction<C>): void;

    abstract setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void;

    abstract setSelectionOperator(selectionOperator: Selection<C>): void;

    abstract setLocalSearchOperators(localSearchOperators: LocalSearch<C>[]): void;

    abstract getNumberOfIterations(): number;

    abstract getCurrentSolution(): C[];

    abstract getFitnessFunctions(): Iterable<FitnessFunction<C>>;

    abstract getStartTime(): number;

    /**
     * Evaluates the current Population of Chromosomes and stops as soon as we have reached a stopping criterion.
     * @param population the population to evaluate.
     */
    protected async evaluatePopulation(population: C[]): Promise<void> {
        for (const chromosome of population) {
            // Check if we have already reached our stopping condition; if so stop and exclude non-executed chromosomes
            if (await this._stoppingCondition.isFinished(this)) {
                const executedChromosomes = population.filter(chromosome => (chromosome as unknown as TestChromosome).trace);
                Arrays.clear(population);
                population.push(...executedChromosomes);
                return;
            } else {
                await chromosome.evaluate(true);
                await this.updateArchive(chromosome);
            }
        }
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param candidateChromosome The candidate chromosome for the archive.
     */
    protected async updateArchive(candidateChromosome: C): Promise<void> {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            const candidateFitness = await candidateChromosome.getFitness(fitnessFunction);
            const candidateLength = candidateChromosome.getLength();
            if (await fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                bestLength = candidateLength;
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }
        this._bestIndividuals = Arrays.distinct(this._archive.values());
    }

    /**
     * Updates the StatisticsCollector on the following points:
     *  - bestTestSuiteSize
     *  - iterationCount
     *  - createdTestsToReachFullCoverage
     *  - timeToReachFullCoverage
     *  - coverage over time timeline
     */
    protected updateStatistics(): void {
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        StatisticsCollector.getInstance().incrementIterationCount();
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (this._iterations + 1) * this._properties['populationSize']; // FIXME: unsafe access
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
        this.updateCoverageTimeLine();
    }

    /**
     * Updates the coverage over time timeline.
     */
    protected updateCoverageTimeLine(): void {
        StatisticsCollector.getInstance().updateCoverageTimeLine();
    }

    /**
     * Reports the current coverage (branch/statement percentages) to the UI's coverage-over-time chart.
     */
    protected _emitCoverageUpdate(): void {
        emitCoverageUpdate(this._iterations);
    }

    /**
     * Reports a single best/average fitness value to the UI's fitness-over-time chart. Overridden by
     * many-objective algorithms (e.g. MOSA) to report a value per currently active target instead.
     */
    protected _emitFitnessUpdate(best: number, average?: number, label?: string): void {
        emitFitnessUpdate(this._iterations, best, average, label);
    }

    /**
     * Maps fitness-function keys to their CDG node ids, dropping any key that isn't backed by a
     * StatementFitnessFunction. Used by _emitCdgUpdate() overrides to build the "currently targeted" set.
     * Uses the target node directly rather than getNodeId(), since BranchCoverageFitnessFunction overrides
     * the latter to append a "-True"/"-False" suffix that matches no CDG node.
     */
    protected _mapKeysToNodeIds(keys: Iterable<number>): Set<string> {
        const nodeIds = new Set<string>();
        for (const key of keys) {
            const fitnessFunction = this._fitnessFunctions.get(key);
            if (fitnessFunction instanceof StatementFitnessFunction) {
                nodeIds.add(String(fitnessFunction.getTargetNode().id));
            }
        }
        return nodeIds;
    }

    /**
     * Reports the CDG to the UI (statement coverage is read from StatisticsCollector by emitCdgUpdate).
     * Single-target algorithms override this to mark the one objective they're currently searching for;
     * many-objective algorithms (e.g. MOSA, MIO) override it to mark their whole active frontier.
     */
    protected _emitCdgUpdate(): void {
        emitCdgUpdate(Container.cdg, new Set());
    }


    /**
     * Target keys that have been included in a reported frontier at least once, i.e. shown as "current"
     * in the fitness chart - only these can meaningfully transition to "covered" there.
     */
    private _reportedFrontierTargets = new Set<number>();

    /**
     * Target keys already reported as covered via _emitFrontierUpdate(), so each is only reported once.
     */
    private _reportedCoveredTargets = new Set<number>();

    /**
     * Reports best/average scores towards several currently active targets at once, rather than a single
     * value - shared by every algorithm that pursues multiple targets simultaneously (e.g. MOSA, MIO);
     * only how scores are obtained per target, and whether higher or lower counts as "best", differs.
     * @param activeTargets keys of the targets to report.
     * @param getScores returns the scores to aggregate for a given target key.
     * @param pickBest picks the best score out of a target's scores (e.g. Math.min for distance, Math.max
     * for a 0-1 heuristic).
     */
    protected async _emitFrontierUpdate(activeTargets: number[],
        getScores: (key: number) => number[] | Promise<number[]>,
        pickBest: (scores: number[]) => number): Promise<void> {
        // Only a target that was actually shown as "current" can meaningfully move to "covered" in the
        // chart - an objective archived before ever appearing in a reported frontier has nothing to move.
        if (Container.vm) {
            for (const key of this._reportedFrontierTargets) {
                if (this._archive.has(key) && !this._reportedCoveredTargets.has(key)) {
                    this._reportedCoveredTargets.add(key);
                    Container.vm.emit('OBJECTIVE_COVERED', {
                        objectiveKey: key,
                        label: this._fitnessFunctions.get(key)?.toString() ?? `Objective ${key}`
                    });
                }
            }
        }

        if (!Container.vm || activeTargets.length === 0) return;

        const perTarget = (await Promise.all(activeTargets.map(async key => {
            const scores = await getScores(key);
            if (scores.length === 0) return null;
            const best = pickBest(scores);
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const label = this._fitnessFunctions.get(key)?.toString() ?? `Objective ${key}`;
            return {
                targetKey: key,
                label,
                best: Number(best.toFixed(4)),
                average: Number(average.toFixed(4))
            };
        }))).filter(entry => entry !== null);

        if (perTarget.length === 0) return;
        for (const entry of perTarget) {
            this._reportedFrontierTargets.add(entry.targetKey);
        }
        Container.vm.emit('FITNESS_UPDATE', {
            generation: this._iterations,
            best: perTarget[0].best,
            average: perTarget[0].average,
            label: perTarget[0].label,
            perTarget
        });
    }

}
