import {readFileSync} from 'fs';
import {ModelLoader} from "../../../../src/whisker/model/util/ModelLoader";

/**
 * Test for errors for the moment
 */
describe('ModelLoaderjson', () => {
    test('Load model from json', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph.json', 'utf8');
        const loader = new ModelLoader();
        expect(loader.loadModels(text)).not.toBeNull();
    });

    test('Edge with two conditions', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-multiple-edge-conditions.json', 'utf8');
        const loader = new ModelLoader();
        expect(loader.loadModels(text)).not.toBeNull();
    });

    test('Duplicated graph id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-graph-id.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).not.toThrow();
    });

    test('Duplicated node id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-node-id.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('Duplicated edge id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-edge-id.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).not.toThrow();
    });

    test('No condition on edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-edge-condition.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('No start node given.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-startnode.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('Two start nodes given.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-two-startnodes.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('Unknown end node of edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-unknown-node1.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('Unknown start node of edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-unknown-node2.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('Edge condition type wrong.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-edge-condition.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('No node id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-node-id.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).toThrow();
    });

    test('No edge id.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-noterror-no-edge-id.json', 'utf8');
        const loader = new ModelLoader();
        expect(function () {
            loader.loadModels(text);
        }).not.toThrow();
    });
});
