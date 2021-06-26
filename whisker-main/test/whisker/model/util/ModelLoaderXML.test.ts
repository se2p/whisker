import {readFileSync} from 'fs';
import {ModelLoaderXML} from "../../../../src/whisker/model/util/ModelLoaderXML";

/**
 * Test for errors for the moment
 */
describe('ModelLoaderXML', () => {
    test('Load model from xml', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(loader.loadModels(text)).not.toBeNull();
    });

    test('Edge with two conditions', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-multiple-edge-conditions.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(loader.loadModels(text)).not.toBeNull();
    });

    test('Duplicated graph id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-graph-id.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).not.toThrow();
    });

    test('Duplicated node id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-node-id.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('Duplicated edge id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-dup-edge-id.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).not.toThrow();
    });

    test('No condition on edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-edge-condition.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('No start node given.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-startnode.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('Two start nodes given.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-two-startnodes.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('Unknown end node of edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-unknown-node1.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('Unknown start node of edge.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-unknown-node2.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('Edge condition type wrong.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-edge-condition.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('No node id', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-error-no-node-id.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).toThrow();
    });

    test('No edge id.', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph-noterror-no-edge-id.xml', 'utf8');
        const loader = new ModelLoaderXML();
        expect(function () {
            loader.loadModels(text)
        }).not.toThrow();
    });
});
