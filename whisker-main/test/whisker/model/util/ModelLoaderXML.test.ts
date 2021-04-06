
import {readFileSync} from 'fs';
import {ModelLoaderXML} from "../../../../src/whisker/model/util/ModelLoaderXML";

/**
 * Test for errors for the moment
 */
describe('ModelLoaderXML', () => {
    test('Load model from graphml', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph.graphml', 'utf8');
        const loader = new ModelLoaderXML();
        const model = loader.loadModels(text);
    });

    test('Load model from xml', () => {
        const text = readFileSync('test/whisker/model/util/SimpleGraph.xml', 'utf8');
        const loader = new ModelLoaderXML();
        const model = loader.loadModels(text);
    });
});
