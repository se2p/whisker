import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NeuroevolutionExecutor} from "../NeuroevolutionExecutor";
import {Container} from "../../utils/Container";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {NeatChromosome} from "../NeatChromosome";


export class ScoreFitness implements NetworkFitnessFunction<NeatChromosome> {

    async getFitness(network: NeatChromosome, timeout: number): Promise<number> {
        const executor = new NeuroevolutionExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const score = this.gatherPoints(Container.vm);
        network.networkFitness = score + 0.01;
        return network.networkFitness;
    }

    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    private gatherPoints(vm: VirtualMachine) : number{
        let points = 0;
        for (const target of vm.runtime.targets) {
            for (const value of Object.values(target.variables)) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (value.name === 'Punkte' || value.name === 'score' || value.name === 'coins' || value.name === 'room') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    points += Number(value.value)
                }
            }
        }
        return points;
    }
}
