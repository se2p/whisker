import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";


export class ScoreFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates the score the network has achieved while playing the game.
     * @param network the network that should be evaluated
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the achieved score.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, false);
        await executor.execute(network);
        let score = ScoreFitness.gatherPoints(Container.vm);
        if (score < 0) {
            score = 0.01;
        }
        network.fitness = score;
        executor.resetState();
        return network.fitness;
    }

    /**
     * Calculates the reached score by matching various variable names against variables contained within the given
     * Scratch project. All found variables are summed up to get a final score.
     * @param vm the Scratch-VM after the playthrough.
     * @returns number representing the achieved score of the network.
     */
    public static gatherPoints(vm: VirtualMachine): number {
        let points = 0;
        for (const target of vm.runtime.targets) {
            for (const value of Object.values(target.variables)) {
                const name = value['name'].toLowerCase();
                if (name.includes('punkte') ||
                    name.includes('points') ||
                    name.includes('score') ||
                    name.includes('level') ||
                    name.includes('hits') ||
                    name.includes('treffer') ||
                    //name.includes('scrollx') ||  // Super Mario
                    name === 'distance' || // Sprint Game
                    name === 'länge' || // Snake Game
                    name === 'geimpfte' || // VirusBuster Game
                    name === 'progress') // WeightLifter Game
                {
                    if (value['type'] != 'list' && typeof value['value'] === 'number') {
                        points += Math.abs(Number(value['value']));
                    }
                }
            }
        }
        return points;
    }
}
