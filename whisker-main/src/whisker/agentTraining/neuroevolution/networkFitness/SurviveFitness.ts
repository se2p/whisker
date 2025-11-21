import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../networks/NetworkChromosome";
import {Container} from "../../../utils/Container";
import {NetworkExecutor} from "../misc/NetworkExecutor";
import {ClassificationType, NeuroevolutionEventSelection} from "../hyperparameter/BasicNeuroevolutionParameter";

export class SurviveFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Calculates how long a network has survived within a game.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @param classificationType defines how the networks select events.
     * @returns Promise<number> the survived time in seconds.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection,
                     classificationType: ClassificationType): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection,
            classificationType, false);
        await executor.execute(network);
        network.fitness = network.playTime;
        await executor.resetState();
        return network.playTime;
    }
}
