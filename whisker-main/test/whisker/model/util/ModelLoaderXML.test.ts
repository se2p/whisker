
import {readFileSync} from 'fs';
import {ModelLoaderXML} from "../../../../src/whisker/model/util/ModelLoaderXML";

const text = readFileSync('./SimpleGraph.graphml', 'utf8');
const loader = new ModelLoaderXML();
const model = loader.loadModels(text);

console.log(model);

// todo test model
const textXML = readFileSync('./SimpleGraph.xml', 'utf8');
const modelXML =  loader.loadModels(textXML);

// todo compare the two models?
