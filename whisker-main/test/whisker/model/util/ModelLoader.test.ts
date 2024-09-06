import {readFileSync} from 'fs';
import {ModelLoader} from "../../../../src/whisker/model/util/ModelLoader";

/**
 * Test for errors for the moment
 */
describe('ModelLoaderjson', () => {
    describe('loadModels() returns correct number of models', () => {
        const table: [string, string, number, number, number][] = [
            ["Load model from json", 'test/whisker/model/models/SimpleGraph.json', 2, 0, 0],
            ["Edge with two conditions", 'test/whisker/model/models/SimpleGraph-multiple-edge-conditions.json', 2, 0, 0],
            ["Duplicated graph id", 'test/whisker/model/models/SimpleGraph-error-dup-graph-id.json', 2, 0, 0],
            ["Duplicated edge id", 'test/whisker/model/models/SimpleGraph-error-dup-edge-id.json', 1, 0, 0],
            ["No edge id.", 'test/whisker/model/models/SimpleGraph-noterror-no-edge-id.json', 2, 0, 0]
        ];
        it.each(table)('%s',
            (name: string, file: string, pmCount: number, umCount: number, otemCount: number) => {
                const text = readFileSync(file, 'utf8');
                const loader = new ModelLoader();
                const result = loader.loadModels(text);
                expect(result.programModels.length).toBe(pmCount);
                expect(result.userModels.length).toBe(umCount);
                expect(result.onTestEndModels.length).toBe(otemCount);
            });
    });

    describe('Loading invalid Models fails', () => {
        const table: [string, string][] = [
            ["Duplicated node id", 'test/whisker/model/models/SimpleGraph-error-dup-node-id.json'],
            ["No condition on edge.", 'test/whisker/model/models/SimpleGraph-error-no-edge-condition.json'],
            ["No start node given.", 'test/whisker/model/models/SimpleGraph-error-no-startnode.json'],
            ["Two start nodes given.", 'test/whisker/model/models/SimpleGraph-error-two-startnodes.json'],
            ["Unknown end node of edge.", 'test/whisker/model/models/SimpleGraph-error-unknown-node1.json'],
            ["Unknown start node of edge.", 'test/whisker/model/models/SimpleGraph-error-unknown-node2.json'],
            ["Edge condition type wrong.", 'test/whisker/model/models/SimpleGraph-error-edge-condition.json'],
            ["No node id", 'test/whisker/model/models/SimpleGraph-error-no-node-id.json']
        ];
        it.each(table)('%s', (name: string, file: string) => {
            const text = readFileSync(file, 'utf8');
            const loader = new ModelLoader();
            expect(function () {
                loader.loadModels(text);
            }).toThrow();
        });
    });
});
