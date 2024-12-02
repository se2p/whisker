import {ModelJSON} from "./canonical";

let idUndefined = 0;

export function nextId(): number {
    return idUndefined++;
}

export function parse(text: string): ModelJSON[] {
    idUndefined = 0;
    return ModelJSON.array().parse(JSON.parse(text)) as ModelJSON[];
}
