import {ModelJSON} from "./canonical";
import {LegacyModelJSON} from "./legacy";

const schema = ModelJSON.or(LegacyModelJSON).array();

let idUndefined = 0;

export function nextId(): number {
    return idUndefined++;
}

export function parse(text: string): (ModelJSON | LegacyModelJSON)[] {
    idUndefined = 0;
    return schema.parse(JSON.parse(text)) as (ModelJSON | LegacyModelJSON)[];
}
