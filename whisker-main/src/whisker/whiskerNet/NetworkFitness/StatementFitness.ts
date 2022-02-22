import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";


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
        if(network.targetFitness.isCovered(network)){
            network.fitness = 1;
        }
        else {
            const fitness = StatementFitnessFunction._normalize(network.targetFitness.getBranchDistance(network));
            network.fitness = 1 - fitness;
        }
        executor.resetState();
        return network.fitness;
    }

    public identifier(): string {
        return 'statement';
    }
}
