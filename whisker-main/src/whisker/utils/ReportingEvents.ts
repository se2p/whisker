import { Container } from "./Container";
import { StatisticsCollector } from "./StatisticsCollector";

/**
 * The FITNESS_UPDATE payload reported to the UI's fitness-over-time chart for a single best/average value.
 * Shared by every search algorithm's basic fitness reporting - many-objective algorithms extend this with
 * a `perTarget` breakdown instead of reporting just one value.
 */
export interface FitnessUpdateData {
    generation: number;
    best: number;
    average?: number;
    label?: string;
}

/**
 * Reports the current coverage (branch/statement percentages) to the UI's coverage-over-time chart.
 */
export function emitCoverageUpdate(iteration: number): void {
    if (!Container.vm) return;
    Container.vm.emit('COVERAGE_UPDATE', {
        iteration,
        branchCoverage: StatisticsCollector.getInstance().branchCoverage,
        statementCoverage: StatisticsCollector.getInstance().statementCoverage
    });
}

/**
 * Reports a single best/average fitness value to the UI's fitness-over-time chart.
 */
export function emitFitnessUpdate(iteration: number, best: number, average?: number, label?: string): void {
    if (!Container.vm) return;
    const data: FitnessUpdateData = {
        generation: iteration,
        best: Number(best.toFixed(4))
    };
    if (average != undefined)
        data.average = Number(average.toFixed(4));
    if (label != undefined)
        data.label = label;
    Container.vm.emit('FITNESS_UPDATE', data);
}
