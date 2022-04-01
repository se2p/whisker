import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../NetworkExecutor";

export class SurviveFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates how long a network has survived within a game.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the network should be executed (random | activation).
     * @returns Promise<number> the survived time in seconds.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: string): Promise<number> {
        const start = Date.now();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, false);
        await executor.execute(network);
        // Calculate time survived, transform it into seconds and include acceleration.
        const surviveTime = Math.trunc((Date.now() - start)) / 1000 * Container.acceleration;
        network.fitness = surviveTime;
        executor.resetState();
        return surviveTime;
    }

    public identifier(): string {
        return 'survive';
    }
}
