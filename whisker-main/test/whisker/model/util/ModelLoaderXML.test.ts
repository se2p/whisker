
import {readFileSync} from 'fs';
import {ModelLoaderXML} from "../../../../src/whisker/model/util/ModelLoaderXML";

const text = readFileSync('test/whisker/model/util/SimpleGraph.graphml', 'utf8');
const loader = new ModelLoaderXML();
const model = loader.loadModels(text);

console.log(model);

// todo test model
const textXML = readFileSync('test/whisker/model/util/SimpleGraph.xml', 'utf8');
const modelXML =  loader.loadModels(textXML);

// todo compare the two models?
