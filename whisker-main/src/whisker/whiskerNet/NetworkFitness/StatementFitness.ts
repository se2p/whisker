import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";


export class StatementFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Fetches the targeted statement of a network and calculates its fitness.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the network should be executed (random | activation).
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: string): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection);
        await executor.execute(network);
        const branchFitness = network.targetFitness.getBranchDistance(network);
        const approachLevel = network.targetFitness.getApproachLevel(network);
        const cfgDistance = network.targetFitness.getCFGDistance(network, approachLevel > 0);
        network.fitness = branchFitness + 10000 * approachLevel;
        if(branchFitness === 0){
            network.fitness += cfgDistance;
        }
        executor.resetState();
        return network.fitness;
    }

    public identifier(): string {
        return 'statement';
    }
}
