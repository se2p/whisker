import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {NetworkChromosome} from "../NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";


export class ScoreFitness implements NetworkFitnessFunction<NetworkChromosome> {

    private readonly offset: number;

    constructor(offset: number) {
        this.offset = offset;
    }

    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const score = this.gatherPoints(Container.vm);
        network.networkFitness = score + this.offset;
        return network.networkFitness;
    }

    async getRandomFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.executeRandom(network);
        const score = this.gatherPoints(Container.vm);
        network.networkFitness = score + this.offset;
        return network.networkFitness;
    }

    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        const score = this.gatherPoints(Container.vm) + this.offset;
        return score
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    private gatherPoints(vm: VirtualMachine): number {
        let points = 0;
        for (const target of vm.runtime.targets) {
            for (const value of Object.values(target.variables)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (value.name === 'Punkte' || value.name === 'score' || value.name === 'coins' || value.name === 'room' || value.name === 'high score') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    points += Number(value.value)
                }
            }
        }
        return points;
    }
}
