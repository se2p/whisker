import {ModelJSON} from "./canonical";
import {LegacyModelJSON} from "./legacy";

const schema = ModelJSON.or(LegacyModelJSON).array();

export function parse(text: string): (ModelJSON | LegacyModelJSON)[] {
    return schema.parse(JSON.parse(text)) as (ModelJSON | LegacyModelJSON)[];
}
